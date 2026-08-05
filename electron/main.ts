import dotenv from 'dotenv';
dotenv.config({ path: process.cwd() + '/.env' });
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { exec } from 'child_process'
import { fetchAIResponse } from './aiServiceCore.js'
import type { FetchAIParams } from './types.js'
import { dbService, type MessageRecord } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

// Папка для кэширования видеофайлов на ПК
const videosCacheDir = join(app.getPath('userData'), 'videos')
if (!existsSync(videosCacheDir)) {
  mkdirSync(videosCacheDir, { recursive: true })
}

// Генерация списка ссылок (аналог Swift логики)
const allLinksBlond = Array.from({ length: 94 }, (_, i) => 
  `https://raw.githubusercontent.com/npanezai9-ux/vidiosAIGF/main/blondvid/blondVid${i + 1}.mp4`
)
const allLinksBrunet = Array.from({ length: 99 }, (_, i) => 
  `https://raw.githubusercontent.com/npanezai9-ux/vidiosAIGF/main/brunetvid/brunetVid${i + 1}.mp4`
)
const allLinks = [...allLinksBlond, ...allLinksBrunet]

function selectVideoUrl(avatar?: string): string {
  const fileName = avatar?.split('/').pop()?.toLowerCase() || ''
  let category: 'blond' | 'brunet' | 'all' = 'all'

  if (['1.jpg', '2.jpg', '4.jpg', '7.jpg', '10.jpg'].includes(fileName)) {
    category = 'blond'
  } else if (['3.jpg', '5.jpg', '6.jpg', '8.jpg', '9.jpg'].includes(fileName)) {
    category = 'brunet'
  }

  const pool = category === 'blond' ? allLinksBlond : category === 'brunet' ? allLinksBrunet : allLinks
  return pool[Math.floor(Math.random() * pool.length)]
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f0a14',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

// Определение системного языка пользователя (динамическая локаль)
ipcMain.handle('system:get-locale', () => {
  return app.getLocale() || 'en-US'
})

// Определение активной раскладки клавиатуры macOS
ipcMain.handle('get-keyboard-layout', async () => {
  return new Promise((resolve) => {
    exec('defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleSelectedInputSources', (error, stdout) => {
      if (error || !stdout) {
        console.error('Failed to get layout:', error)
        resolve('en-US')
        return
      }

      if (stdout.includes('Russian') || stdout.includes('Cyrillic')) {
        resolve('ru-RU')
      } else if (stdout.includes('Spanish')) {
        resolve('es-ES')
      } else if (stdout.includes('German')) {
        resolve('de-DE')
      } else if (stdout.includes('French')) {
        resolve('fr-FR')
      } else {
        resolve('en-US')
      }
    })
  })
})

ipcMain.handle('ai:fetch', async (_event, params: FetchAIParams) => {
  const authToken = process.env.VITE_APP_SECRET_TOKEN || ''
  return fetchAIResponse(params, authToken)
})

// IPC Handler для получения/скачивания видео (аналог RemoteVideoService)
ipcMain.handle('video:get', async (_, avatar?: string) => {
  try {
    const urlString = selectVideoUrl(avatar)
    const urlParts = urlString.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const localFilePath = join(videosCacheDir, fileName)

    // Если файла нет на диске — скачиваем
    if (!existsSync(localFilePath)) {
      console.log(`[VideoService] Downloading video from ${urlString}`)
      const response = await fetch(urlString)
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      writeFileSync(localFilePath, buffer)
    } else {
      console.log(`[VideoService] Video found in cache: ${fileName}`)
    }

    // Читаем файл в буфер и возвращаем как base64 data-url
    const fileBuffer = readFileSync(localFilePath)
    return `data:video/mp4;base64,${fileBuffer.toString('base64')}`
  } catch (err) {
    console.error('[VideoService ERROR] Failed to load video:', err)
    return null
  }
})

// IPC Handlers for SQLite
ipcMain.handle('db:get-messages', () => {
  try {
    return dbService.getAllMessages()
  } catch (err) {
    console.error('[SQLite ERROR] Failed to get messages:', err)
    return []
  }
})

ipcMain.handle('db:save-message', (_, message: MessageRecord) => {
  try {
    dbService.saveMessage(message)
  } catch (err) {
    console.error('[SQLite ERROR] Failed to save message:', err)
  }
})

ipcMain.handle('db:clear-history', () => {
  try {
    dbService.clearHistory()
  } catch (err) {
    console.error('[SQLite ERROR] Failed to clear history:', err)
  }
})

ipcMain.handle('db:get-characters', () => {
  try {
    return dbService.getCharacters()
  } catch (err) {
    console.error('[SQLite ERROR] Failed to get characters:', err)
    return []
  }
})

ipcMain.handle('db:get-messages-by-character', (_, characterId: string) => {
  try {
    return dbService.getMessagesByCharacter(characterId)
  } catch (err) {
    console.error('[SQLite ERROR] Failed to get messages for character:', err)
    return []
  }
})

ipcMain.handle('db:get-last-message', (_, characterId: string) => {
  try {
    return dbService.getLastMessageByCharacter(characterId)
  } catch (err) {
    console.error('[SQLite ERROR] Failed to get last message:', err)
    return null
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})