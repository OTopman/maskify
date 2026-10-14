import { MaskContext } from './masker';

// Standard ECMAScript %AsyncFunction% constructor
const AsyncFunction: any = Object.getPrototypeOf(async function () { }).constructor;

export type InferMasker<T> =
  T extends { isMaskifyOptional: true; inner: infer Inner }
  ? InferMasker<Inner> | undefined
  : T extends { isMaskifyNullable: true; inner: infer Inner }
  ? InferMasker<Inner> | null
  : T extends { isMaskifyNullish: true; inner: infer Inner }
  ? InferMasker<Inner> | null | undefined
  : T extends { isMaskifyArray: true; element: infer E }
  ? InferMasker<E>[]
  : T extends [infer E]
  ? InferMasker<E>[]
  : T extends { isMaskifyDiscriminatedUnion: true; cases: Record<string, infer C> }
  ? InferMasker<C>
  : T extends { isMaskifyUnion: true; schemas: (infer U)[] }
  ? InferMasker<U>
  : T extends { schema: infer S }
  ? S extends Record<string, any>
  ? { [K in keyof S]: InferMasker<S[K]> }
  : any
  : T extends ObjectMasker<infer S>
  ? { [K in keyof S]: InferMasker<S[K]> }
  : T extends AsyncObjectMasker<infer S>
  ? { [K in keyof S]: InferMasker<S[K]> }
  : T extends (val: any, ctx?: MaskContext) => Promise<infer O>
  ? O
  : T extends (val: any, ctx?: MaskContext) => infer O
  ? O
  : T extends Record<string, any>
  ? { [K in keyof T]: InferMasker<T[K]> }
  : T;

export class ObjectMasker<TSchema extends Record<string, any>> {
  public compiledFn!: (obj: any, schema: any, ctx: MaskContext) => any;
  public schema!: TSchema;

  constructor(schema: TSchema) {
    this.schema = schema;
    this.compiledFn = this.compileSchema(schema);
  }

  // The callable method
  call(value: any, ctx?: MaskContext): any {
    if (value == null) return value;
    if (Array.isArray(value)) {
      return value.map((item) => this.compiledFn(item, this.schema, ctx || {}));
    }
    return this.compiledFn(value, this.schema, ctx || {});
  }

  private compileSchema(schema: Record<string, any>): (obj: any, schema: any, ctx: MaskContext) => any {
    const keys = Object.keys(schema);
    const bodyLines: string[] = [];

    bodyLines.push('if (!obj || typeof obj !== "object") return obj;');
    bodyLines.push('const res = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));');
    // Not Object.assign(res, obj): copying an own "__proto__" key (e.g. from
    // JSON.parse of untrusted input) would invoke the inherited __proto__
    // setter and swap res's prototype. Skip that key explicitly instead.
    bodyLines.push('var __keys = Object.keys(obj);');
    bodyLines.push('for (var __i = 0; __i < __keys.length; __i++) {');
    bodyLines.push('  var __k = __keys[__i];');
    bodyLines.push('  if (__k !== "__proto__") res[__k] = obj[__k];');
    bodyLines.push('}');

    for (const key of keys) {
      const field = schema[key];
      const escapedKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      if (field && (field.isMaskifyArray || field instanceof ArrayMasker)) {
        const el = field.element;
        const innerSchema = field.rawSchema || (el && 'schema' in el ? el.schema : el);
        if (innerSchema && typeof innerSchema === 'object' && !(el instanceof ObjectMasker)) {
          field.element = new ObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) {`);
        bodyLines.push(`      var el = schema["${escapedKey}"].element;`);
        bodyLines.push(`      if (el && typeof el.compiledFn === 'function') return el.compiledFn(item, el.schema, ctx);`);
        bodyLines.push(`      if (typeof el === 'function') return el(item, ctx);`);
        bodyLines.push(`      return item;`);
        bodyLines.push(`    });`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var el = schema["${escapedKey}"].element;`);
        bodyLines.push(`    if (el && typeof el.compiledFn === 'function') res["${escapedKey}"] = el.compiledFn(obj["${escapedKey}"], el.schema, ctx);`);
        bodyLines.push(`    else if (typeof el === 'function') res["${escapedKey}"] = el(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyOptional) {
        const inner = field.inner;
        const innerSchema = field.rawSchema || (inner && 'schema' in inner ? inner.schema : inner);
        if (innerSchema && typeof innerSchema === 'object' && !(inner instanceof ObjectMasker)) {
          field.inner = new ObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined) {`);
        bodyLines.push(`  if (obj["${escapedKey}"] === null) {`);
        bodyLines.push(`    res["${escapedKey}"] = null;`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var inner = schema["${escapedKey}"].inner;`);
        bodyLines.push(`    if (inner && typeof inner.compiledFn === 'function') res["${escapedKey}"] = inner.compiledFn(obj["${escapedKey}"], inner.schema, ctx);`);
        bodyLines.push(`    else if (typeof inner === 'function') res["${escapedKey}"] = inner(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyNullable) {
        const inner = field.inner;
        const innerSchema = field.rawSchema || (inner && 'schema' in inner ? inner.schema : inner);
        if (innerSchema && typeof innerSchema === 'object' && !(inner instanceof ObjectMasker)) {
          field.inner = new ObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (obj["${escapedKey}"] === undefined) {`);
        bodyLines.push(`    res["${escapedKey}"] = undefined;`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var inner = schema["${escapedKey}"].inner;`);
        bodyLines.push(`    if (inner && typeof inner.compiledFn === 'function') res["${escapedKey}"] = inner.compiledFn(obj["${escapedKey}"], inner.schema, ctx);`);
        bodyLines.push(`    else if (typeof inner === 'function') res["${escapedKey}"] = inner(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyNullish) {
        const inner = field.inner;
        const innerSchema = field.rawSchema || (inner && 'schema' in inner ? inner.schema : inner);
        if (innerSchema && typeof innerSchema === 'object' && !(inner instanceof ObjectMasker)) {
          field.inner = new ObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  var inner = schema["${escapedKey}"].inner;`);
        bodyLines.push(`  if (inner && typeof inner.compiledFn === 'function') res["${escapedKey}"] = inner.compiledFn(obj["${escapedKey}"], inner.schema, ctx);`);
        bodyLines.push(`  else if (typeof inner === 'function') res["${escapedKey}"] = inner(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyDiscriminatedUnion) {
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null && typeof obj["${escapedKey}"] === "object") {`);
        bodyLines.push(`  var tag = obj["${escapedKey}"][schema["${escapedKey}"].discriminator];`);
        bodyLines.push(`  var target = schema["${escapedKey}"].cases[tag];`);
        bodyLines.push(`  if (target) {`);
        bodyLines.push(`    if (typeof target.compiledFn === 'function') res["${escapedKey}"] = target.compiledFn(obj["${escapedKey}"], target.schema, ctx);`);
        bodyLines.push(`    else if (typeof target === 'function') res["${escapedKey}"] = target(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyUnion) {
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  res["${escapedKey}"] = schema["${escapedKey}"](obj["${escapedKey}"], ctx);`);
        bodyLines.push(`}`);
      } else if (typeof field === 'function') {
        if (typeof field.compiledFn === 'function') {
          bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
          bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
          bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) { return schema["${escapedKey}"].compiledFn(item, schema["${escapedKey}"].schema, ctx); });`);
          bodyLines.push(`  } else {`);
          bodyLines.push(`    res["${escapedKey}"] = schema["${escapedKey}"].compiledFn(obj["${escapedKey}"], schema["${escapedKey}"].schema, ctx);`);
          bodyLines.push(`  }`);
          bodyLines.push(`}`);
        } else {
          bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
          bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
          bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) { return schema["${escapedKey}"](item, ctx); });`);
          bodyLines.push(`  } else {`);
          bodyLines.push(`    res["${escapedKey}"] = schema["${escapedKey}"](obj["${escapedKey}"], ctx);`);
          bodyLines.push(`  }`);
          bodyLines.push(`}`);
        }
      } else if (field && Array.isArray(field)) {
        const element = field[0];
        if (element && typeof element === 'object' && typeof (element as any).compiledFn !== 'function') {
          const nestedMasker = new ObjectMasker(element);
          schema[key] = [nestedMasker];
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) {`);
        bodyLines.push(`      var el = schema["${escapedKey}"][0];`);
        bodyLines.push(`      if (typeof el === 'function') return el(item, ctx);`);
        bodyLines.push(`      if (el && typeof el.compiledFn === 'function') return el.compiledFn(item, el.schema, ctx);`);
        bodyLines.push(`      return item;`);
        bodyLines.push(`    });`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var el = schema["${escapedKey}"][0];`);
        bodyLines.push(`    if (typeof el === 'function') res["${escapedKey}"] = el(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`    else if (el && typeof el.compiledFn === 'function') res["${escapedKey}"] = el.compiledFn(obj["${escapedKey}"], el.schema, ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && typeof field === 'object') {
        const nestedMasker = new ObjectMasker(field);
        schema[key] = nestedMasker;
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) { return schema["${escapedKey}"].compiledFn(item, schema["${escapedKey}"].schema, ctx); });`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    res["${escapedKey}"] = schema["${escapedKey}"].compiledFn(obj["${escapedKey}"], schema["${escapedKey}"].schema, ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      }
    }

    bodyLines.push('return res;');

    return new Function('obj', 'schema', 'ctx', bodyLines.join('\n')) as any;
  }
}

export class AsyncObjectMasker<TSchema extends Record<string, any>> {
  public compiledFn!: (obj: any, schema: any, ctx: MaskContext) => Promise<any>;
  public schema!: TSchema;

  constructor(schema: TSchema) {
    this.schema = schema;
    this.compiledFn = this.compileSchema(schema);
  }

  async call(value: any, ctx?: MaskContext): Promise<any> {
    if (value == null) return value;
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => this.compiledFn(item, this.schema, ctx || {})));
    }
    return this.compiledFn(value, this.schema, ctx || {});
  }

  private compileSchema(schema: Record<string, any>): (obj: any, schema: any, ctx: MaskContext) => Promise<any> {
    const keys = Object.keys(schema);
    const bodyLines: string[] = [];

    bodyLines.push('if (!obj || typeof obj !== "object") return obj;');
    bodyLines.push('const res = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));');
    bodyLines.push('var __keys = Object.keys(obj);');
    bodyLines.push('for (var __i = 0; __i < __keys.length; __i++) {');
    bodyLines.push('  var __k = __keys[__i];');
    bodyLines.push('  if (__k !== "__proto__") res[__k] = obj[__k];');
    bodyLines.push('}');

    for (const key of keys) {
      const field = schema[key];
      const escapedKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      if (field && (field.isMaskifyArray || field instanceof ArrayMasker)) {
        const el = field.element;
        const innerSchema = field.rawSchema || (el && 'schema' in el ? el.schema : el);
        if (innerSchema && typeof innerSchema === 'object' && !Array.isArray(innerSchema)) {
          field.element = new AsyncObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = await Promise.all(obj["${escapedKey}"].map(async function(item) {`);
        bodyLines.push(`      var el = schema["${escapedKey}"].element;`);
        bodyLines.push(`      if (el && typeof el.compiledFn === 'function') return await el.compiledFn(item, el.schema, ctx);`);
        bodyLines.push(`      if (typeof el === 'function') return await el(item, ctx);`);
        bodyLines.push(`      return item;`);
        bodyLines.push(`    }));`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var el = schema["${escapedKey}"].element;`);
        bodyLines.push(`    if (el && typeof el.compiledFn === 'function') res["${escapedKey}"] = await el.compiledFn(obj["${escapedKey}"], el.schema, ctx);`);
        bodyLines.push(`    else if (typeof el === 'function') res["${escapedKey}"] = await el(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyOptional) {
        const inner = field.inner;
        const innerSchema = field.rawSchema || (inner && 'schema' in inner ? inner.schema : inner);
        if (innerSchema && typeof innerSchema === 'object' && !Array.isArray(innerSchema)) {
          field.inner = new AsyncObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined) {`);
        bodyLines.push(`  if (obj["${escapedKey}"] === null) {`);
        bodyLines.push(`    res["${escapedKey}"] = null;`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var inner = schema["${escapedKey}"].inner;`);
        bodyLines.push(`    if (inner && typeof inner.compiledFn === 'function') res["${escapedKey}"] = await inner.compiledFn(obj["${escapedKey}"], inner.schema, ctx);`);
        bodyLines.push(`    else if (typeof inner === 'function') res["${escapedKey}"] = await inner(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyNullable) {
        const inner = field.inner;
        const innerSchema = field.rawSchema || (inner && 'schema' in inner ? inner.schema : inner);
        if (innerSchema && typeof innerSchema === 'object' && !Array.isArray(innerSchema)) {
          field.inner = new AsyncObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (obj["${escapedKey}"] === undefined) {`);
        bodyLines.push(`    res["${escapedKey}"] = undefined;`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var inner = schema["${escapedKey}"].inner;`);
        bodyLines.push(`    if (inner && typeof inner.compiledFn === 'function') res["${escapedKey}"] = await inner.compiledFn(obj["${escapedKey}"], inner.schema, ctx);`);
        bodyLines.push(`    else if (typeof inner === 'function') res["${escapedKey}"] = await inner(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyNullish) {
        const inner = field.inner;
        const innerSchema = field.rawSchema || (inner && 'schema' in inner ? inner.schema : inner);
        if (innerSchema && typeof innerSchema === 'object' && !Array.isArray(innerSchema)) {
          field.inner = new AsyncObjectMasker(innerSchema);
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  var inner = schema["${escapedKey}"].inner;`);
        bodyLines.push(`  if (inner && typeof inner.compiledFn === 'function') res["${escapedKey}"] = await inner.compiledFn(obj["${escapedKey}"], inner.schema, ctx);`);
        bodyLines.push(`  else if (typeof inner === 'function') res["${escapedKey}"] = await inner(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyDiscriminatedUnion) {
        for (const tag of Object.keys(field.cases)) {
          const caseSchema = field.cases[tag];
          const innerSchema = caseSchema && 'schema' in caseSchema ? caseSchema.schema : caseSchema;
          if (innerSchema && typeof innerSchema === 'object' && !Array.isArray(innerSchema)) {
            field.cases[tag] = new AsyncObjectMasker(innerSchema);
          }
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null && typeof obj["${escapedKey}"] === "object") {`);
        bodyLines.push(`  var tag = obj["${escapedKey}"][schema["${escapedKey}"].discriminator];`);
        bodyLines.push(`  var target = schema["${escapedKey}"].cases[tag];`);
        bodyLines.push(`  if (target) {`);
        bodyLines.push(`    if (typeof target.compiledFn === 'function') res["${escapedKey}"] = await target.compiledFn(obj["${escapedKey}"], target.schema, ctx);`);
        bodyLines.push(`    else if (typeof target === 'function') res["${escapedKey}"] = await target(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && field.isMaskifyUnion) {
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  res["${escapedKey}"] = await schema["${escapedKey}"](obj["${escapedKey}"], ctx);`);
        bodyLines.push(`}`);
      } else if (typeof field === 'function') {
        const innerSchema = field && 'schema' in field ? field.schema : null;
        if (innerSchema && typeof innerSchema === 'object' && !(field instanceof AsyncObjectMasker)) {
          schema[key] = new AsyncObjectMasker(innerSchema);
          bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
          bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
          bodyLines.push(`    res["${escapedKey}"] = await Promise.all(obj["${escapedKey}"].map(async function(item) { return await schema["${escapedKey}"].compiledFn(item, schema["${escapedKey}"].schema, ctx); }));`);
          bodyLines.push(`  } else {`);
          bodyLines.push(`    res["${escapedKey}"] = await schema["${escapedKey}"].compiledFn(obj["${escapedKey}"], schema["${escapedKey}"].schema, ctx);`);
          bodyLines.push(`  }`);
          bodyLines.push(`}`);
        } else if (typeof field.compiledFn === 'function') {
          bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
          bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
          bodyLines.push(`    res["${escapedKey}"] = await Promise.all(obj["${escapedKey}"].map(async function(item) { return await schema["${escapedKey}"].compiledFn(item, schema["${escapedKey}"].schema, ctx); }));`);
          bodyLines.push(`  } else {`);
          bodyLines.push(`    res["${escapedKey}"] = await schema["${escapedKey}"].compiledFn(obj["${escapedKey}"], schema["${escapedKey}"].schema, ctx);`);
          bodyLines.push(`  }`);
          bodyLines.push(`}`);
        } else {
          bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
          bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
          bodyLines.push(`    res["${escapedKey}"] = await Promise.all(obj["${escapedKey}"].map(async function(item) { return await schema["${escapedKey}"](item, ctx); }));`);
          bodyLines.push(`  } else {`);
          bodyLines.push(`    res["${escapedKey}"] = await schema["${escapedKey}"](obj["${escapedKey}"], ctx);`);
          bodyLines.push(`  }`);
          bodyLines.push(`}`);
        }
      } else if (field && Array.isArray(field)) {
        const element = field[0];
        const innerSchema = element && 'schema' in element ? element.schema : element;
        if (innerSchema && typeof innerSchema === 'object') {
          const nestedMasker = new AsyncObjectMasker(innerSchema);
          schema[key] = [nestedMasker];
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = await Promise.all(obj["${escapedKey}"].map(async function(item) {`);
        bodyLines.push(`      var el = schema["${escapedKey}"][0];`);
        bodyLines.push(`      if (el && typeof el.compiledFn === 'function') return await el.compiledFn(item, el.schema, ctx);`);
        bodyLines.push(`      if (typeof el === 'function') return await el(item, ctx);`);
        bodyLines.push(`      return item;`);
        bodyLines.push(`    }));`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    var el = schema["${escapedKey}"][0];`);
        bodyLines.push(`    if (el && typeof el.compiledFn === 'function') res["${escapedKey}"] = await el.compiledFn(obj["${escapedKey}"], el.schema, ctx);`);
        bodyLines.push(`    else if (typeof el === 'function') res["${escapedKey}"] = await el(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && typeof field === 'object') {
        const nestedMasker = new AsyncObjectMasker(field);
        schema[key] = nestedMasker;
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = await Promise.all(obj["${escapedKey}"].map(async function(item) { return await schema["${escapedKey}"].compiledFn(item, schema["${escapedKey}"].schema, ctx); }));`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    res["${escapedKey}"] = await schema["${escapedKey}"].compiledFn(obj["${escapedKey}"], schema["${escapedKey}"].schema, ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      }
    }

    bodyLines.push('return res;');

    return new AsyncFunction('obj', 'schema', 'ctx', bodyLines.join('\n')) as any;
  }
}

export class ArrayMasker<TElement> {
  public element: TElement;
  public rawSchema?: any;
  public isMaskifyArray = true as const;

  constructor(element: TElement) {
    if (element && typeof element === 'object' && typeof (element as any).compiledFn !== 'function' && !Array.isArray(element)) {
      this.rawSchema = element;
      this.element = object(element as any) as any;
    } else {
      this.element = element;
    }
  }

  call(value: any, ctx?: MaskContext): any {
    if (value == null || !Array.isArray(value)) return value;
    const el: any = this.element;
    const mapped = value.map((item) => {
      if (el && typeof el.compiledFn === 'function') {
        return el.compiledFn(item, el.schema, ctx || {});
      }
      if (typeof el === 'function') {
        return el(item, ctx || {});
      }
      return item;
    });

    if (mapped.some((item) => item && typeof (item as any).then === 'function')) {
      return Promise.all(mapped);
    }
    return mapped;
  }

  async callAsync(value: any, ctx?: MaskContext): Promise<any> {
    if (value == null || !Array.isArray(value)) return value;
    const el: any = this.element;
    return Promise.all(
      value.map(async (item) => {
        if (el && typeof el.compiledFn === 'function') {
          return await el.compiledFn(item, el.schema, ctx || {});
        }
        if (typeof el === 'function') {
          return await el(item, ctx || {});
        }
        return item;
      })
    );
  }
}

export interface ArrayMaskerCallable<TElement> {
  (value: any, ctx?: MaskContext): any;
  element: TElement;
  rawSchema?: any;
  isMaskifyArray: true;
}

export function array<TElement>(element: TElement): ArrayMaskerCallable<TElement> {
  const instance = new ArrayMasker(element);
  const callable = ((val: any, ctx?: MaskContext) => instance.call(val, ctx)) as unknown as ArrayMaskerCallable<TElement>;
  callable.element = instance.element;
  callable.rawSchema = instance.rawSchema;
  callable.isMaskifyArray = true as const;
  return callable;
}

export interface OptionalMaskerCallable<T> {
  (value: any, ctx?: MaskContext): any;
  inner: T;
  rawSchema?: any;
  isMaskifyOptional: true;
}

export function optional<T>(inner: T): OptionalMaskerCallable<T> {
  let rawSchema: any = undefined;
  let innerFn = inner;
  if (inner && typeof inner === 'object' && typeof (inner as any).compiledFn !== 'function') {
    rawSchema = inner;
    innerFn = object(inner as any) as any;
  }

  const callable = ((val: any, ctx?: MaskContext) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof innerFn === 'function') return innerFn(val, ctx);
    if (innerFn && typeof (innerFn as any).compiledFn === 'function') return (innerFn as any).compiledFn(val, (innerFn as any).schema, ctx);
    return val;
  }) as unknown as OptionalMaskerCallable<T>;

  callable.inner = innerFn;
  callable.rawSchema = rawSchema;
  callable.isMaskifyOptional = true as const;
  return callable;
}

export interface NullableMaskerCallable<T> {
  (value: any, ctx?: MaskContext): any;
  inner: T;
  rawSchema?: any;
  isMaskifyNullable: true;
}

export function nullable<T>(inner: T): NullableMaskerCallable<T> {
  let rawSchema: any = undefined;
  let innerFn = inner;
  if (inner && typeof inner === 'object' && typeof (inner as any).compiledFn !== 'function') {
    rawSchema = inner;
    innerFn = object(inner as any) as any;
  }

  const callable = ((val: any, ctx?: MaskContext) => {
    if (val === null) return null;
    if (val === undefined) return undefined;
    if (typeof innerFn === 'function') return innerFn(val, ctx);
    if (innerFn && typeof (innerFn as any).compiledFn === 'function') return (innerFn as any).compiledFn(val, (innerFn as any).schema, ctx);
    return val;
  }) as unknown as NullableMaskerCallable<T>;

  callable.inner = innerFn;
  callable.rawSchema = rawSchema;
  callable.isMaskifyNullable = true as const;
  return callable;
}

export interface NullishMaskerCallable<T> {
  (value: any, ctx?: MaskContext): any;
  inner: T;
  rawSchema?: any;
  isMaskifyNullish: true;
}

export function nullish<T>(inner: T): NullishMaskerCallable<T> {
  let rawSchema: any = undefined;
  let innerFn = inner;
  if (inner && typeof inner === 'object' && typeof (inner as any).compiledFn !== 'function') {
    rawSchema = inner;
    innerFn = object(inner as any) as any;
  }

  const callable = ((val: any, ctx?: MaskContext) => {
    if (val == null) return val;
    if (typeof innerFn === 'function') return innerFn(val, ctx);
    if (innerFn && typeof (innerFn as any).compiledFn === 'function') return (innerFn as any).compiledFn(val, (innerFn as any).schema, ctx);
    return val;
  }) as unknown as NullishMaskerCallable<T>;

  callable.inner = innerFn;
  callable.rawSchema = rawSchema;
  callable.isMaskifyNullish = true as const;
  return callable;
}

export interface DiscriminatedUnionMaskerCallable<
  TDiscriminator extends string,
  TCases extends Record<string, any>
> {
  (value: any, ctx?: MaskContext): any;
  discriminator: TDiscriminator;
  cases: TCases;
  isMaskifyDiscriminatedUnion: true;
}

export function discriminatedUnion<
  TDiscriminator extends string,
  TCases extends Record<string, any>
>(
  discriminator: TDiscriminator,
  rawCases: TCases
): DiscriminatedUnionMaskerCallable<TDiscriminator, TCases> {
  const cases: Record<string, any> = {};
  for (const [key, schema] of Object.entries(rawCases)) {
    if (schema && typeof schema === 'object' && typeof (schema as any).compiledFn !== 'function') {
      cases[key] = object(schema);
    } else {
      cases[key] = schema;
    }
  }

  const callable = ((val: any, ctx?: MaskContext) => {
    if (!val || typeof val !== 'object') return val;
    const tag = val[discriminator];
    const target = cases[tag];
    if (!target) return val;
    if (typeof target.compiledFn === 'function') {
      return target.compiledFn(val, target.schema, ctx || {});
    }
    if (typeof target === 'function') {
      return target(val, ctx || {});
    }
    return val;
  }) as unknown as DiscriminatedUnionMaskerCallable<TDiscriminator, TCases>;

  callable.discriminator = discriminator;
  callable.cases = cases as TCases;
  callable.isMaskifyDiscriminatedUnion = true as const;
  return callable;
}

export interface UnionMaskerCallable<TSchemas extends any[]> {
  (value: any, ctx?: MaskContext): any;
  schemas: TSchemas;
  isMaskifyUnion: true;
}

export function union<TSchemas extends any[]>(
  ...rawSchemas: TSchemas
): UnionMaskerCallable<TSchemas> {
  const schemas = rawSchemas.map((s) => {
    if (s && typeof s === 'object' && typeof (s as any).compiledFn !== 'function') {
      return object(s);
    }
    return s;
  }) as TSchemas;

  const callable = ((val: any, ctx?: MaskContext) => {
    if (val == null) return val;
    for (const s of schemas as any[]) {
      if (typeof s._condition === 'function') {
        if (s._condition(val, ctx)) {
          return s(val, ctx);
        }
      } else if (typeof s === 'function') {
        const res = s(val, ctx);
        if (res !== val) return res;
      }
    }
    if (schemas.length > 0 && typeof (schemas[0] as any) === 'function') {
      return (schemas[0] as any)(val, ctx);
    }
    return val;
  }) as unknown as UnionMaskerCallable<TSchemas>;

  callable.schemas = schemas;
  callable.isMaskifyUnion = true as const;
  return callable;
}

export interface ObjectMaskerCallable<TSchema extends Record<string, any>> {
  (value: any, ctx?: MaskContext): any;
  schema: TSchema;
  compiledFn: (obj: any, schema: any, ctx: MaskContext) => any;
  extend<TExtra extends Record<string, any>>(
    extension: TExtra | { schema: TExtra }
  ): ObjectMaskerCallable<Omit<TSchema, keyof TExtra> & TExtra>;
  pick<K extends keyof TSchema>(...keys: K[]): ObjectMaskerCallable<Pick<TSchema, K>>;
  omit<K extends keyof TSchema>(...keys: K[]): ObjectMaskerCallable<Omit<TSchema, K>>;
  async(): AsyncObjectMaskerCallable<TSchema>;
}

export interface AsyncObjectMaskerCallable<TSchema extends Record<string, any>> {
  (value: any, ctx?: MaskContext): Promise<any>;
  schema: TSchema;
  compiledFn: (obj: any, schema: any, ctx: MaskContext) => Promise<any>;
  extend<TExtra extends Record<string, any>>(
    extension: TExtra | { schema: TExtra }
  ): AsyncObjectMaskerCallable<Omit<TSchema, keyof TExtra> & TExtra>;
  pick<K extends keyof TSchema>(...keys: K[]): AsyncObjectMaskerCallable<Pick<TSchema, K>>;
  omit<K extends keyof TSchema>(...keys: K[]): AsyncObjectMaskerCallable<Omit<TSchema, K>>;
}

export function object<TSchema extends Record<string, any>>(
  schema: TSchema
): ObjectMaskerCallable<TSchema> {
  const instance = new ObjectMasker(schema);
  const callable = ((val: any, ctx?: MaskContext) => instance.call(val, ctx)) as unknown as ObjectMaskerCallable<TSchema>;
  callable.schema = instance.schema;
  callable.compiledFn = instance.compiledFn;

  callable.extend = (ext: any) => {
    const extraSchema = ext && typeof ext === 'object' && 'schema' in ext ? ext.schema : ext;
    return object({ ...instance.schema, ...extraSchema });
  };

  callable.pick = (...keys: any[]) => {
    const picked: any = {};
    for (const k of keys) {
      if (k in instance.schema) picked[k] = instance.schema[k];
    }
    return object(picked);
  };

  callable.omit = (...keys: any[]) => {
    const omitted: any = { ...instance.schema };
    for (const k of keys) {
      delete omitted[k];
    }
    return object(omitted);
  };

  callable.async = () => objectAsync(instance.schema);

  return callable;
}

export function objectAsync<TSchema extends Record<string, any>>(
  schema: TSchema
): AsyncObjectMaskerCallable<TSchema> {
  const instance = new AsyncObjectMasker(schema);
  const callable = ((val: any, ctx?: MaskContext) => instance.call(val, ctx)) as unknown as AsyncObjectMaskerCallable<TSchema>;
  callable.schema = instance.schema;
  callable.compiledFn = instance.compiledFn;

  callable.extend = (ext: any) => {
    const extraSchema = ext && typeof ext === 'object' && 'schema' in ext ? ext.schema : ext;
    return objectAsync({ ...instance.schema, ...extraSchema });
  };

  callable.pick = (...keys: any[]) => {
    const picked: any = {};
    for (const k of keys) {
      if (k in instance.schema) picked[k] = instance.schema[k];
    }
    return objectAsync(picked);
  };

  callable.omit = (...keys: any[]) => {
    const omitted: any = { ...instance.schema };
    for (const k of keys) {
      delete omitted[k];
    }
    return objectAsync(omitted);
  };

  return callable;
}
