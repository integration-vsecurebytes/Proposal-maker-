import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useEditorStore, PlacedAsset } from '@/stores/editor';
import { useAssetsStore, GraphicAsset } from '@/stores/assets';
import { useCallback } from 'react';

export function useDragAndDrop() {
  const addAsset = useEditorStore((state) => state.addAsset);
  const updateAsset = useEditorStore((state) => state.updateAsset);
  const gridEnabled = useEditorStore((state) => state.gridEnabled);
  const snapEnabled = useEditorStore((state) => state.snapEnabled);
  const gridSize = useEditorStore((state) => state.gridSize);
  const addToRecents = useAssetsStore((state) => state.addToRecents);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    })
  );

  const snapToGrid = useCallback(
    (value: number) => {
      if (!snapEnabled) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapEnabled, gridSize]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag started:', active.id);

    // Could add visual feedback here
    // For example, highlighting valid drop zones
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Could show preview of where asset will be placed
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) {
        console.log('Drag ended outside drop zone');
        return;
      }

      console.log('Drag ended:', { activeId: active.id, overId: over.id });

      // Get the asset being dragged
      const assetData = active.data.current as { asset: GraphicAsset; type: string };

      if (!assetData || assetData.type !== 'graphic-asset') {
        console.warn('Invalid drag data');
        return;
      }

      const asset = assetData.asset;

      // Get the drop zone data
      const dropZoneData = over.data.current as {
        zone: 'cover' | 'header' | 'footer' | 'section';
        sectionIndex?: number;
      };

      if (!dropZoneData) {
        console.warn('Invalid drop zone data');
        return;
      }

      // Calculate position within the drop zone
      // For now, center the asset in the zone
      const dropZoneElement = document.querySelector(`[data-drop-zone="${over.id}"]`);
      const dropZoneRect = dropZoneElement?.getBoundingClientRect();

      let x = 0;
      let y = 0;

      if (dropZoneRect) {
        // Center in the drop zone
        x = dropZoneRect.width / 2 - 50; // Assuming asset is ~100px wide
        y = dropZoneRect.height / 2 - 50; // Assuming asset is ~100px tall

        // Apply grid snapping
        x = snapToGrid(x);
        y = snapToGrid(y);
      }

      // Get highest z-index for this zone
      const existingAssets = useEditorStore.getState().placedAssets.filter((a) => {
        if (dropZoneData.sectionIndex !== undefined) {
          return a.zone === dropZoneData.zone && a.sectionIndex === dropZoneData.sectionIndex;
        }
        return a.zone === dropZoneData.zone;
      });

      const maxZIndex = existingAssets.length > 0
        ? Math.max(...existingAssets.map((a) => a.zIndex))
        : 0;

      // Create placed asset
      const placedAsset: PlacedAsset = {
        id: `placed-${asset.id}-${Date.now()}`,
        assetId: asset.id,
        zone: dropZoneData.zone,
        sectionIndex: dropZoneData.sectionIndex,
        position: { x, y },
        size: {
          width: 100, // Default size, user can resize later
          height: 100,
        },
        opacity: 1,
        zIndex: maxZIndex + 1,
      };

      // Add to editor state
      addAsset(placedAsset);

      // Add to recents
      addToRecents(asset.id);

      console.log('Asset placed:', placedAsset);
    },
    [addAsset, addToRecents, snapToGrid]
  );

  const handleDragCancel = useCallback(() => {
    console.log('Drag cancelled');
  }, []);

  return {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
