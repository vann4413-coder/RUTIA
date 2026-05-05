import { useState } from 'react';
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

function StopDetail({ stop }: { stop: Stop }) {
  const updateStop = useRouteStore((s) => s.updateStop);
  const markVisited = useRouteStore((s) => s.markVisited);

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-2">
      <div>
        <label htmlFor={`label-${stop.id}`} className="mb-0.5 block text-xs font-medium text-gray-500">
          Alias (opcional)
        </label>
        <input
          id={`label-${stop.id}`}
          type="text"
          defaultValue={stop.label ?? ''}
          onBlur={(e) => updateStop(stop.id, { label: e.target.value || undefined })}
          placeholder="Ej: Casa de María"
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]"
        />
      </div>
      <div>
        <label htmlFor={`note-${stop.id}`} className="mb-0.5 block text-xs font-medium text-gray-500">
          Nota
        </label>
        <textarea
          id={`note-${stop.id}`}
          defaultValue={stop.note ?? ''}
          onBlur={(e) => updateStop(stop.id, { note: e.target.value || undefined })}
          placeholder="Añade una nota…"
          maxLength={500}
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]"
        />
      </div>
      <div>
        <label htmlFor={`phone-${stop.id}`} className="mb-0.5 block text-xs font-medium text-gray-500">
          Teléfono
        </label>
        <input
          id={`phone-${stop.id}`}
          type="tel"
          defaultValue={stop.phone ?? ''}
          onBlur={(e) => updateStop(stop.id, { phone: e.target.value || undefined })}
          placeholder="+34 600 000 000"
          className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A0]"
        />
      </div>
      <button
        onClick={() => markVisited(stop.id, !stop.visited)}
        className={`w-full rounded-lg border py-1.5 text-sm font-medium transition-colors ${
          stop.visited
            ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
            : 'border-[#0EA5A0] text-[#0EA5A0] hover:bg-teal-50'
        }`}
      >
        {stop.visited ? 'Marcar como pendiente' : 'Marcar como visitada'}
      </button>
    </div>
  );
}

function SortableStop({ stop, index }: { stop: Stop; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const removeStop = useRouteStore((s) => s.removeStop);
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border bg-white px-3 py-2.5 shadow-sm ${isDragging ? 'opacity-50' : ''} ${
        stop.visited ? 'opacity-60' : ''
      }`}
    >
      {/* Row principal */}
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          aria-label="Arrastrar para reordenar"
          className="cursor-grab text-gray-300 active:cursor-grabbing"
        >
          ⠿
        </button>

        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0EA5A0] text-xs font-bold text-white">
          {index + 1}
        </span>

        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-left"
        >
          <p
            className={`truncate text-sm font-medium text-gray-800 ${stop.visited ? 'line-through text-gray-400' : ''}`}
          >
            {stop.label ?? stop.address}
          </p>
          {stop.label && <p className="truncate text-xs text-gray-400">{stop.address}</p>}
          {stop.note && !expanded && (
            <p className="truncate text-xs text-gray-400 italic">{stop.note}</p>
          )}
        </button>

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
            onChange={(e) => useRouteStore.getState().markVisited(stop.id, e.target.checked)}
            aria-label="Marcar como visitada"
            className="h-4 w-4 accent-[#0EA5A0]"
          />
          <button
            onClick={() => removeStop(stop.id)}
            aria-label="Eliminar parada"
            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>

      {expanded && <StopDetail stop={stop} />}
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

  const orderedStops: Stop[] = currentRoute.optimizedOrder
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
