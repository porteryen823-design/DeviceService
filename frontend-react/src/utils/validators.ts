// Validation utilities

export const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

export const CONTROLLER_TYPES = ['E82', 'E84', 'E88', 'E90'] as const

export type ControllerType = typeof CONTROLLER_TYPES[number]

export const validateIP = (ip: string): boolean => {
  return IP_REGEX.test(ip)
}

export const validatePort = (port: number): boolean => {
  return port >= 1 && port <= 65535
}

export const validateControllerType = (type: string): boolean => {
  return CONTROLLER_TYPES.includes(type as ControllerType)
}

export const validateDeviceData = (data: {
  proxy_ip: string
  proxy_port: number
  Controller_type: string
  Controller_ip: string
  Controller_port: number
  remark?: string
  enable: boolean
  createUser: string
}): string[] => {
  const errors: string[] = []

  if (!validateIP(data.proxy_ip)) {
    errors.push('請輸入有效的代理 IP 位址')
  }

  if (!validatePort(data.proxy_port)) {
    errors.push('代理埠號必須在 1-65535 之間')
  }

  if (!validateControllerType(data.Controller_type)) {
    errors.push('請選擇有效的控制器類型')
  }

  if (!validateIP(data.Controller_ip)) {
    errors.push('請輸入有效的控制器 IP 位址')
  }

  if (!validatePort(data.Controller_port)) {
    errors.push('控制器埠號必須在 1-65535 之間')
  }

  if (!data.createUser.trim()) {
    errors.push('建立使用者為必填欄位')
  }

  return errors
}