import { TransformFnParams } from 'class-transformer';

export function trimString({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeEmail({ value }: TransformFnParams) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
