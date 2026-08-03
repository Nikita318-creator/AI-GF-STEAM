export interface RemoteConfig {
  configVersion: number
  isMode: boolean
  isTestB: boolean
  needWait24h: boolean
  isProSubs: boolean
  needAlwaysProSubs: boolean
  isUSHaveDifferentPrice: boolean
  useOnlyBillingApi: boolean
  isVideoReady?: boolean
  isFreeMode?: boolean
  isMoodOn?: boolean
  needResetData: boolean
  dailyLimits: number
  initialLimit: number
  blondsVidCount?: number
  BrunetsVidCount?: number
  audioHalfKey?: string
  topicRST: string
  topicForGifts: string
  messageFromDeveloper: string
  additionalPhotos: string
  baseServer?: string
  additionalVideos?: string
  additionalVideosCount?: number
  additionalPromptText?: string
}
