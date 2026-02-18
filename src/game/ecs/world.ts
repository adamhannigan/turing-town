/**
 * Minimal ECS world: entity storage and queries.
 * No external ECS library; kept small so agents can extend it.
 */

import type { Entity, EntityId } from './components';

let nextId: EntityId = 1;

const entities = new Map<EntityId, Entity>();

export function createEntity(components: Partial<Entity>): Entity {
  const id = nextId++;
  const entity: Entity = { id, ...components };
  entities.set(id, entity);
  return entity;
}

export function removeEntity(id: EntityId): void {
  entities.delete(id);
}

export function getEntity(id: EntityId): Entity | undefined {
  return entities.get(id);
}

export function queryEntities<K extends keyof Entity>(
  ...hasComponents: K[]
): Entity[] {
  const result: Entity[] = [];
  for (const entity of entities.values()) {
    if (hasComponents.every((c) => entity[c] !== undefined)) {
      result.push(entity);
    }
  }
  return result;
}

export function clearWorld(): void {
  entities.clear();
  nextId = 1;
}

export function getAllEntities(): Entity[] {
  return Array.from(entities.values());
}
