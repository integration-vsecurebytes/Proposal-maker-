import { useState, useCallback, useMemo } from 'react';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Guide {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
  color?: string;
}

export interface SnapResult {
  position: Position;
  guides: Guide[];
  snapped: boolean;
}

interface SmartGuidesOptions {
  gridSize?: number;
  snapThreshold?: number;
  containerBounds?: Bounds;
  existingElements?: Bounds[];
  enableGoldenRatio?: boolean;
}

const GOLDEN_RATIO = 1.618;
const DEFAULT_GRID_SIZE = 8;
const DEFAULT_SNAP_THRESHOLD = 10;

export function useSmartGuides(options: SmartGuidesOptions = {}) {
  const {
    gridSize = DEFAULT_GRID_SIZE,
    snapThreshold = DEFAULT_SNAP_THRESHOLD,
    containerBounds = { x: 0, y: 0, width: 1000, height: 1414 }, // A4 aspect ratio
    existingElements = [],
    enableGoldenRatio = true,
  } = options;

  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);

  /**
   * Snap a value to the nearest grid line
   */
  const snapToGrid = useCallback(
    (value: number): number => {
      return Math.round(value / gridSize) * gridSize;
    },
    [gridSize]
  );

  /**
   * Check if a value is close enough to snap to a target
   */
  const isWithinSnapThreshold = useCallback(
    (value: number, target: number): boolean => {
      return Math.abs(value - target) <= snapThreshold;
    },
    [snapThreshold]
  );

  /**
   * Calculate golden ratio positions within container
   */
  const goldenRatioPositions = useMemo(() => {
    if (!enableGoldenRatio) return { horizontal: [], vertical: [] };

    const horizontalRatios = [
      containerBounds.width / GOLDEN_RATIO, // 61.8% from left
      containerBounds.width - containerBounds.width / GOLDEN_RATIO, // 38.2% from left
    ];

    const verticalRatios = [
      containerBounds.height / GOLDEN_RATIO, // 61.8% from top
      containerBounds.height - containerBounds.height / GOLDEN_RATIO, // 38.2% from top
    ];

    return {
      horizontal: horizontalRatios,
      vertical: verticalRatios,
    };
  }, [containerBounds, enableGoldenRatio]);

  /**
   * Get alignment guides from existing elements
   */
  const getAlignmentTargets = useCallback(() => {
    const targets = {
      vertical: new Set<number>(),
      horizontal: new Set<number>(),
    };

    // Container edges
    targets.vertical.add(containerBounds.x);
    targets.vertical.add(containerBounds.x + containerBounds.width);
    targets.vertical.add(containerBounds.x + containerBounds.width / 2);

    targets.horizontal.add(containerBounds.y);
    targets.horizontal.add(containerBounds.y + containerBounds.height);
    targets.horizontal.add(containerBounds.y + containerBounds.height / 2);

    // Existing elements edges and centers
    existingElements.forEach((element) => {
      targets.vertical.add(element.x);
      targets.vertical.add(element.x + element.width);
      targets.vertical.add(element.x + element.width / 2);

      targets.horizontal.add(element.y);
      targets.horizontal.add(element.y + element.height);
      targets.horizontal.add(element.y + element.height / 2);
    });

    // Golden ratio positions
    if (enableGoldenRatio) {
      goldenRatioPositions.horizontal.forEach((pos) => targets.vertical.add(pos));
      goldenRatioPositions.vertical.forEach((pos) => targets.horizontal.add(pos));
    }

    return targets;
  }, [containerBounds, existingElements, enableGoldenRatio, goldenRatioPositions]);

  /**
   * Snap element position to nearest guides
   */
  const snapPosition = useCallback(
    (position: Position, elementSize: Size): SnapResult => {
      const targets = getAlignmentTargets();
      const guides: Guide[] = [];
      let snappedX = position.x;
      let snappedY = position.y;
      let snapped = false;

      // Check vertical snapping (X axis)
      const elementCenterX = position.x + elementSize.width / 2;
      const elementRightX = position.x + elementSize.width;

      let closestVerticalDistance = Infinity;
      let closestVerticalTarget: number | null = null;
      let verticalSnapType: 'left' | 'center' | 'right' = 'left';

      targets.vertical.forEach((target) => {
        // Left edge snap
        const leftDistance = Math.abs(position.x - target);
        if (leftDistance < closestVerticalDistance && isWithinSnapThreshold(position.x, target)) {
          closestVerticalDistance = leftDistance;
          closestVerticalTarget = target;
          verticalSnapType = 'left';
        }

        // Center snap
        const centerDistance = Math.abs(elementCenterX - target);
        if (
          centerDistance < closestVerticalDistance &&
          isWithinSnapThreshold(elementCenterX, target)
        ) {
          closestVerticalDistance = centerDistance;
          closestVerticalTarget = target;
          verticalSnapType = 'center';
        }

        // Right edge snap
        const rightDistance = Math.abs(elementRightX - target);
        if (
          rightDistance < closestVerticalDistance &&
          isWithinSnapThreshold(elementRightX, target)
        ) {
          closestVerticalDistance = rightDistance;
          closestVerticalTarget = target;
          verticalSnapType = 'right';
        }
      });

      if (closestVerticalTarget !== null) {
        if (verticalSnapType === 'left') {
          snappedX = closestVerticalTarget;
        } else if (verticalSnapType === 'center') {
          snappedX = closestVerticalTarget - elementSize.width / 2;
        } else {
          snappedX = closestVerticalTarget - elementSize.width;
        }

        guides.push({
          type: 'vertical',
          position: closestVerticalTarget,
          label: verticalSnapType,
          color: goldenRatioPositions.horizontal.includes(closestVerticalTarget)
            ? '#F59E0B'
            : '#3B82F6',
        });
        snapped = true;
      }

      // Check horizontal snapping (Y axis)
      const elementCenterY = position.y + elementSize.height / 2;
      const elementBottomY = position.y + elementSize.height;

      let closestHorizontalDistance = Infinity;
      let closestHorizontalTarget: number | null = null;
      let horizontalSnapType: 'top' | 'center' | 'bottom' = 'top';

      targets.horizontal.forEach((target) => {
        // Top edge snap
        const topDistance = Math.abs(position.y - target);
        if (topDistance < closestHorizontalDistance && isWithinSnapThreshold(position.y, target)) {
          closestHorizontalDistance = topDistance;
          closestHorizontalTarget = target;
          horizontalSnapType = 'top';
        }

        // Center snap
        const centerDistance = Math.abs(elementCenterY - target);
        if (
          centerDistance < closestHorizontalDistance &&
          isWithinSnapThreshold(elementCenterY, target)
        ) {
          closestHorizontalDistance = centerDistance;
          closestHorizontalTarget = target;
          horizontalSnapType = 'center';
        }

        // Bottom edge snap
        const bottomDistance = Math.abs(elementBottomY - target);
        if (
          bottomDistance < closestHorizontalDistance &&
          isWithinSnapThreshold(elementBottomY, target)
        ) {
          closestHorizontalDistance = bottomDistance;
          closestHorizontalTarget = target;
          horizontalSnapType = 'bottom';
        }
      });

      if (closestHorizontalTarget !== null) {
        if (horizontalSnapType === 'top') {
          snappedY = closestHorizontalTarget;
        } else if (horizontalSnapType === 'center') {
          snappedY = closestHorizontalTarget - elementSize.height / 2;
        } else {
          snappedY = closestHorizontalTarget - elementSize.height;
        }

        guides.push({
          type: 'horizontal',
          position: closestHorizontalTarget,
          label: horizontalSnapType,
          color: goldenRatioPositions.vertical.includes(closestHorizontalTarget)
            ? '#F59E0B'
            : '#3B82F6',
        });
        snapped = true;
      }

      // Fallback to grid snapping if no alignment guides matched
      if (!snapped) {
        snappedX = snapToGrid(position.x);
        snappedY = snapToGrid(position.y);
      }

      setActiveGuides(guides);

      return {
        position: { x: snappedX, y: snappedY },
        guides,
        snapped,
      };
    },
    [
      getAlignmentTargets,
      isWithinSnapThreshold,
      snapToGrid,
      goldenRatioPositions,
    ]
  );

  /**
   * Clear active guides
   */
  const clearGuides = useCallback(() => {
    setActiveGuides([]);
  }, []);

  /**
   * Calculate distance between two elements
   */
  const calculateDistance = useCallback(
    (element1: Bounds, element2: Bounds): { horizontal: number; vertical: number } => {
      const horizontal = Math.min(
        Math.abs(element1.x - (element2.x + element2.width)),
        Math.abs(element1.x + element1.width - element2.x)
      );

      const vertical = Math.min(
        Math.abs(element1.y - (element2.y + element2.height)),
        Math.abs(element1.y + element1.height - element2.y)
      );

      return { horizontal, vertical };
    },
    []
  );

  /**
   * Check if element is within container bounds
   */
  const isWithinBounds = useCallback(
    (position: Position, elementSize: Size): boolean => {
      return (
        position.x >= containerBounds.x &&
        position.y >= containerBounds.y &&
        position.x + elementSize.width <= containerBounds.x + containerBounds.width &&
        position.y + elementSize.height <= containerBounds.y + containerBounds.height
      );
    },
    [containerBounds]
  );

  /**
   * Constrain position to container bounds
   */
  const constrainToBounds = useCallback(
    (position: Position, elementSize: Size): Position => {
      return {
        x: Math.max(
          containerBounds.x,
          Math.min(position.x, containerBounds.x + containerBounds.width - elementSize.width)
        ),
        y: Math.max(
          containerBounds.y,
          Math.min(position.y, containerBounds.y + containerBounds.height - elementSize.height)
        ),
      };
    },
    [containerBounds]
  );

  return {
    snapPosition,
    snapToGrid,
    clearGuides,
    activeGuides,
    calculateDistance,
    isWithinBounds,
    constrainToBounds,
    goldenRatioPositions,
  };
}
