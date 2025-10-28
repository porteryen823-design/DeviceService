import React from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  Collapse,
  useTheme,
  Typography
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { ProxyStatusFilter as FilterType, ProxyStatusSort } from '@/types/proxyStatus'

interface ProxyStatusFilterProps {
  filter: FilterType
  sort: ProxyStatusSort
  onFilterChange: (filter: FilterType) => void
  onSortChange: (sort: ProxyStatusSort) => void
  onClear: () => void
  controllerTypes: string[]
}

const ProxyStatusFilterComponent: React.FC<ProxyStatusFilterProps> = ({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onClear,
  controllerTypes
}) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const [expanded, setExpanded] = React.useState(false)

  const handleFilterChange = (key: keyof FilterType, value: string) => {
    onFilterChange({
      ...filter,
      [key]: value === 'all' ? undefined : value
    })
  }

  const handleSortChange = (field: keyof ProxyStatusData) => {
    const newOrder = sort.field === field && sort.order === 'asc' ? 'desc' : 'asc'
    onSortChange({ field, order: newOrder })
  }

  const hasActiveFilters = filter.status || filter.controllerType || filter.search

  return (
    <Card>
      <CardContent sx={{ pb: expanded ? 2 : '16px !important' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={expanded ? 2 : 0}>
          <Box display="flex" alignItems="center">
            <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Button
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              size="small"
            >
              {t('common.filter')}
            </Button>
            {hasActiveFilters && (
              <Chip
                label={t('common.filter')}
                size="small"
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          {hasActiveFilters && (
            <Button
              startIcon={<ClearIcon />}
              onClick={onClear}
              size="small"
              variant="outlined"
            >
              {t('common.filter')}
            </Button>
          )}
        </Box>

        <Collapse in={expanded}>
          <Stack spacing={2}>
            {/* 搜尋欄位 */}
            <TextField
              fullWidth
              placeholder={t('common.search')}
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />

            {/* 狀態篩選 */}
            <FormControl fullWidth size="small">
              <InputLabel>{t('proxy.status')}</InputLabel>
              <Select
                value={filter.status || 'all'}
                label={t('proxy.status')}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">{t('common.loading')}</MenuItem>
                <MenuItem value="running">{t('proxy.online')}</MenuItem>
                <MenuItem value="stopped">{t('proxy.offline')}</MenuItem>
                <MenuItem value="error">{t('proxy.error')}</MenuItem>
                <MenuItem value="timeout">{t('common.loading')}</MenuItem>
              </Select>
            </FormControl>

            {/* 控制器類型篩選 */}
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.loading')}</InputLabel>
              <Select
                value={filter.controllerType || ''}
                label={t('common.loading')}
                onChange={(e) => handleFilterChange('controllerType', e.target.value)}
              >
                <MenuItem value="">{t('common.loading')}</MenuItem>
                {controllerTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 排序選項 */}
            <Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {t('common.loading')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  { key: 'proxyid', label: t('common.loading') },
                  { key: 'message', label: t('proxy.status') },
                  { key: 'controller_type', label: t('common.loading') },
                  { key: 'proxy_ip', label: t('common.loading') }
                ].map((option) => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    onClick={() => handleSortChange(option.key as keyof ProxyStatusData)}
                    variant={sort.field === option.key ? 'filled' : 'outlined'}
                    color={sort.field === option.key ? 'primary' : 'default'}
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      '&::after': sort.field === option.key ? {
                        content: sort.order === 'asc' ? '" ↑"' : '" ↓"',
                        ml: 0.5
                      } : {}
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default ProxyStatusFilterComponent