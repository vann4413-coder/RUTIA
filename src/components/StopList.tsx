import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouteStore } from '../store/routeStore';
import type { Stop } from '../types/domain';

function SortableStop({ stop, index }: { stop: Stop; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const removeStop = useRouteStore((s) => s.removeStop);
  const markVisited = useRouteStore((s) => s.markVisited);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-3 rounded-lg border bg-white p-3 shadow-sm ${
        isDragging ? 'opacity-50' : ''
      } ${stop.visited ? 'opacity-60' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Arrastrar para reordenar"
        className="mt-0.5 cursor-grab text-gray-400 active:cursor-grabbing"
      >
        ⠿
      </button>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0EA5A0] text-xs font-bold text-white">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium text-gray-800 ${stop.visited ? 'line-through' : ''}`}>
          {stop.label ?? stop.address}
        </p>
        {stop.label && (
          <p className="truncate text-xs text-gray-500">{stop.address}</p>
        )}
        {stop.note && <p className="mt-0.5 text-xs text-gray-500">{stop.note}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {stop.phone && (
          <a
            href={`tel:${stop.phone}`}
            aria-label={`Llamar a ${stop.label ?? stop.address}`}
            className="rounded p-1 text-[#0EA5A0] hover:bg-teal-50"
          >
            📞
          </a>
        )}
        <input
          type="checkbox"
          checked={stop.visited}
          onChange={(e) => markVisited(stop.id, e.target.checked)}
          aria-label="Marcar como visitada"
          className="h-4 w-4 accent-[#0EA5A0]"
        />
        <button
          onClick={() => removeStop(stop.id)}
          aria-label="Eliminar parada"
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export function StopList() {
  const currentRoute = useRouteStore((s) => s.currentRoute);
  const reorderStops = useRouteStore((s) => s.reorderStops);

  const sensors = useSensors(useSensor(PointerSensor));

  if (!currentRoute || currentRoute.stops.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-400">
        Añade paradas para comenzar tu ruta.
      </p>
    );
  }

  const orderedStops = currentRoute.optimizedOrder
    ? currentRoute.optimizedOrder
        .map((id) => currentRoute.stops.find((s) => s.id === id))
        .filter((s): s is Stop => s !== undefined)
    : currentRoute.stops;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = orderedStops.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    reorderStops(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedStops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2 px-4 pb-4">
          {orderedStops.map((stop, i) => (
            <SortableStop key={stop.id} stop={stop} index={i} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
