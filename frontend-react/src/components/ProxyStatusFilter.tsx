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
              篩選和搜尋
            </Button>
            {hasActiveFilters && (
              <Chip
                label="已套用篩選"
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
              清除篩選
            </Button>
          )}
        </Box>

        <Collapse in={expanded}>
          <Stack spacing={2}>
            {/* 搜尋欄位 */}
            <TextField
              fullWidth
              placeholder="搜尋 IP、備註、控制器類型或訊息..."
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
            />

            {/* 狀態篩選 */}
            <FormControl fullWidth size="small">
              <InputLabel>狀態篩選</InputLabel>
              <Select
                value={filter.status || 'all'}
                label="狀態篩選"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">全部狀態</MenuItem>
                <MenuItem value="running">運行中</MenuItem>
                <MenuItem value="stopped">已停止</MenuItem>
                <MenuItem value="error">錯誤</MenuItem>
                <MenuItem value="timeout">超時</MenuItem>
              </Select>
            </FormControl>

            {/* 控制器類型篩選 */}
            <FormControl fullWidth size="small">
              <InputLabel>控制器類型</InputLabel>
              <Select
                value={filter.controllerType || ''}
                label="控制器類型"
                onChange={(e) => handleFilterChange('controllerType', e.target.value)}
              >
                <MenuItem value="">全部類型</MenuItem>
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
                排序方式
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  { key: 'proxyid', label: '代理 ID' },
                  { key: 'message', label: '狀態訊息' },
                  { key: 'controller_type', label: '控制器類型' },
                  { key: 'proxy_ip', label: 'IP 位址' }
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