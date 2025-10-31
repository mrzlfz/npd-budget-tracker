'use client'

import React from 'react'
import {
  Group,
  Text,
  Breadcrumbs,
  Anchor,
  Badge,
} from '@mantine/core'
import { IconHome } from '@tabler/icons-react'
import type { RKANode } from './RKATree'

interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

interface RKABreadcrumbsProps {
  currentPath: RKANode[]
  onNavigate?: (node: RKANode) => void
}

export function RKABreadcrumbs({ currentPath, onNavigate }: RKABreadcrumbsProps) {
  const items: BreadcrumbItem[] = [
    { label: 'Beranda', href: '/dashboard' },
  ]

  // Add path nodes to breadcrumbs
  currentPath.forEach((node, index) => {
    items.push({
      label: `${node.kode} - ${node.nama || node.uraian}`,
      onClick: () => onNavigate?.(node),
    })
  })

  const getItemType = (label: string) => {
    if (label === 'Beranda') return 'home'
    if (label.includes('Program')) return 'program'
    if (label.includes('Kegiatan')) return 'kegiatan'
    if (label.includes('Sub Kegiatan')) return 'subkegiatan'
    return 'account'
  }

  return (
    <Group mb="md">
      <Breadcrumbs>
        {items.map((item, index) => (
          <Anchor
            key={index}
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault()
                item.onClick()
              }
            }}
            size="sm"
          >
            <Group gap="xs" align="center">
              {index === 0 && <IconHome size={14} />}
              <Text size="sm">{item.label}</Text>
              {getItemType(item.label) !== 'home' && (
                <Badge
                  size="xs"
                  variant="light"
                  color={
                    getItemType(item.label) === 'program' ? 'blue' :
                    getItemType(item.label) === 'kegiatan' ? 'green' :
                    getItemType(item.label) === 'subkegiatan' ? 'orange' :
                    'gray'
                  }
                >
                  {getItemType(item.label).charAt(0).toUpperCase() + getItemType(item.label).slice(1)}
                </Badge>
              )}
            </Group>
          </Anchor>
        ))}
      </Breadcrumbs>
    </Group>
  )
}