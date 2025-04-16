/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import './networkFilters.css';
import * as React from 'react';
import { useMeasure } from '@web/uiUtils';

const resourceTypes = ['All', 'Fetch', 'HTML', 'JS', 'CSS', 'Font', 'Image'] as const;
export type ResourceType = typeof resourceTypes[number];

export type FilterState = {
  searchValue: string;
  resourceType: ResourceType;
};

export const defaultFilterState: FilterState = { searchValue: '', resourceType: 'All' };

export const NetworkFilters = ({ filterState, onFilterStateChange }: {
  filterState: FilterState,
  onFilterStateChange: (filterState: FilterState) => void,
}) => {
  // useMeasure 훅을 사용하여 resource-types 컨테이너의 크기를 측정
  const [containerRect, containerRef] = useMeasure<HTMLDivElement>();

  // 숨길 탭 목록을 상태로 관리 (ResourceType 배열)
  const [hiddenTabs, setHiddenTabs] = React.useState<ResourceType[]>([]);
  // "More ▼" 버튼이 차지할 대략적인 너비 (px)
  const moreButtonReserve = 60;

  // 컨테이너의 자식(탭)들의 너비를 계산해, 가용 너비를 초과하면 숨길 탭 결정
  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    const children = Array.from(containerRef.current.children) as HTMLElement[];
    let cumulativeWidth = 0;
    const newHidden: ResourceType[] = [];

    // resourceTypes 배열 순서대로 각 탭의 너비를 합산합니다.
    // 단, 선택된 탭은 숨기지 않도록 우선순위를 낮춰 마지막에 숨기도록 처리합니다.
    const sortedTabs = [...resourceTypes].sort((a, b) => {
      if (a === filterState.resourceType) return 1; // 선택된 탭은 나중에 숨김
      if (b === filterState.resourceType) return -1;
      return 0;
    });

    sortedTabs.forEach((rt, index) => {
      // children의 순서는 resourceTypes 순서와 같다고 가정합니다.
      const child = children[index];
      if (!child) return;
      const w = child.offsetWidth;
      // 가용 너비를 초과하면 해당 탭은 숨깁니다.
      if (cumulativeWidth + w > containerRect.width - moreButtonReserve && rt !== filterState.resourceType) {
        newHidden.push(rt);
      } else {
        cumulativeWidth += w;
      }
    });

    // 선택된 탭이 숨겨져 있다면, 숨겨진 탭 목록의 맨 뒤로 이동시킵니다.
    if (newHidden.includes(filterState.resourceType)) {
      const filtered = newHidden.filter(rt => rt !== filterState.resourceType);
      filtered.push(filterState.resourceType);
      setHiddenTabs(filtered);
    } else {
      setHiddenTabs(newHidden);
    }
  }, [containerRect.width, filterState.resourceType, containerRef]);

  return (
    <div className='network-filters'>
      <input
        type='search'
        placeholder='Filter network'
        spellCheck={false}
        value={filterState.searchValue}
        onChange={e => onFilterStateChange({ ...filterState, searchValue: e.target.value })}
      />

      <div className='network-filters-resource-types' ref={containerRef}>
        {resourceTypes.map(rt => (
          <div
            key={rt}
            title={rt}
            onClick={() => {
              onFilterStateChange({ ...filterState, resourceType: rt });
            }}
            // 숨길 탭은 display: none 처리, 나머지는 inline-block으로 표시
            style={{ display: hiddenTabs.includes(rt) ? 'none' : 'inline-block' }}
            className={`network-filters-resource-type ${filterState.resourceType === rt ? 'selected' : ''}`}
          >
            {rt}
          </div>
        ))}

        {/* 숨겨진 탭이 하나라도 있으면 More 버튼 표시 */}
        {hiddenTabs.length > 0 && (
          <div
            className='network-filters-resource-type'
            onClick={() => {
              // 여기선 간단히 첫 번째 숨긴 탭으로 전환합니다.
              // 실제 구현에서는 드롭다운 메뉴를 구현해 여러 숨긴 탭을 보여줄 수 있습니다.
              const tab = hiddenTabs[0];
              onFilterStateChange({ ...filterState, resourceType: tab });
            }}
          >
            More ▼
          </div>
        )}
      </div>
    </div>
  );
};
