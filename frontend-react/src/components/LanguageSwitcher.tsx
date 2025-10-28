import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Box,
  Typography,
} from '@mui/material'
import { locales } from '@/locales'

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const selectedLanguage = event.target.value
    i18n.changeLanguage(selectedLanguage)
  }

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        displayEmpty
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        {locales.map((locale) => (
          <MenuItem key={locale.code} value={locale.code}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2">{locale.flag}</Typography>
              <Typography variant="body2">{locale.nativeName}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default LanguageSwitcher