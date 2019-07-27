/// <reference path="./@types/is-subset.d.ts" />

import { JsonRpcMiddleware } from 'json-rpc-engine';
import { isSubset } from "./@types/is-subset";
import { unauthorized } from './errors';
import { IOcapLdCaveat } from './@types/ocap-ld';
const isSubset = require('is-subset');
const dequal = require('fast-deep-equal');

interface ISerializedCaveat {
  type: string;
  value?: any;
}

export type ICaveatFunction = JsonRpcMiddleware;

export type ICaveatFunctionGenerator = (caveat:ISerializedCaveat) => ICaveatFunction;

// caveat types
const FILTER_PARAMS = 'filterParams';
const FILTER_RESPONSE = 'filterResponse';
export const CAVEAT_TYPES = {
  FILTER_PARAMS,
  FILTER_RESPONSE,
}

// Caveat function generators

/*
 * Filters params shallowly.
 * MVP caveats with lots of room for enhancement later.
 */
export const filterParams: ICaveatFunctionGenerator = function filterParams(serialized: ISerializedCaveat) {
  const { value } = serialized;
  return (req, res, next, end) => {
    const permitted = isSubset(req.params, value);

    if (!permitted) {
      res.error = unauthorized(req);
      return end(res.error);
    }

    next();
  }
}

/*
 * Filters array results shallowly.
 * MVP caveat for signing in with accounts.
 * Lots of room for enhancement later.
 */
export const filterResponse: ICaveatFunctionGenerator = function filterResponse(serialized: ISerializedCaveat) {
  const { value } = serialized;
  return (_req, res, next, _end) => {

    next((done) => {
      if (Array.isArray(res.result)) {
        res.result = res.result.filter((item) => {
          return value.includes(item);
        })
      }
      done();
    });
  }
}

// Utils

/**
 * Check whether the two given caveats are equal.
 * @param {ISerializedCaveat} a - The first caveat.
 * @param {ISerializedCaveat} b - The second caveat.
 */
export function caveatEqual (a: ISerializedCaveat, b: ISerializedCaveat): boolean {

  if (a.type !== b.type) return false;

  switch (a.type) {

    case FILTER_PARAMS:
      return dequal(a.value, b.value);

    case FILTER_RESPONSE:
      return dequal(a.value, b.value);

    default:
      throw new Error('Unrecognized caveat.');
  }
}

/**
 * Sorts the given capability's caveats and their values.
 * @param {IOcapLdCapability} capability - The capability whose caveats to sort.
 */
export function sortCaveats (caveats: IOcapLdCaveat[]): void {
  if (!Array.isArray(caveats)) return;
  caveats.sort(compareCaveats);
  for (let i = 0; i < caveats.length; i++) {
    if (Array.isArray(caveats[i].value)) {
      caveats[i].value.sort();
    }
  }
}

function compareCaveats (a: ISerializedCaveat, b: ISerializedCaveat): number {
  if (a.type !== b.type) return a.type.localeCompare(b.type, 'en');
  if (a.value !== b.value) {
    if (a.value !== undefined && b.value !== undefined) {
      // TODO: better-specify caveat values so we know that these
      // stringify calls don't fail
      return JSON.stringify(a.value)
      .localeCompare(JSON.stringify(b.value));
    }
    if (a.value !== undefined) return -1;
    return 1;
  }
  return 0;
}
