# AI GF Desktop

Десктопное приложение AI-подруги на **Electron + React + Tailwind CSS**.

## Стек

- **Electron** — нативное окно приложения
- **React 19 + TypeScript** — UI
- **Vite** — сборка и hot reload
- **Tailwind CSS** — стилизация

## Запуск

```bash
# Установка зависимостей
npm install

# Разработка (Vite + Electron)
npm run electron:dev

# Только веб-версия (браузер)
npm run dev
```

## Сборка

```bash
npm run build
npm run electron:build
```

## Структура

```
ai-gf-desktop/
├── electron/          # Main & preload процессы
├── src/
│   ├── components/    # UI-компоненты чата
│   ├── types/         # TypeScript типы
│   ├── App.tsx        # Главный компонент
│   └── main.tsx       # Точка входа React
├── index.html
└── vite.config.ts
```

## Интерфейс

- Боковая панель с профилем персонажа
- Чат с пузырьками сообщений и индикатором набора
- Тёмная тема с розово-фиолетовыми акцентами
- Демо-ответы AI (заглушка для будущей интеграции с API)
