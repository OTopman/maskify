import { MaskContext } from './masker';

export type InferMasker<T> = T extends (val: infer I, ctx?: MaskContext) => infer O
  ? O
  : T extends ObjectMasker<infer S>
  ? { [K in keyof S]: InferMasker<S[K]> }
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

      if (typeof field === 'function') {
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) { return schema["${escapedKey}"](item, ctx); });`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    res["${escapedKey}"] = schema["${escapedKey}"](obj["${escapedKey}"], ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && Array.isArray(field)) {
        const element = field[0];
        if (element && typeof element === 'object' && typeof (element as any).compiledFn !== 'function') {
          const nestedMasker = new ObjectMasker(element);
          schema[key] = [nestedMasker];
        }
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) {`);
        bodyLines.push(`      const el = schema["${escapedKey}"][0];`);
        bodyLines.push(`      if (typeof el === 'function') return el(item, ctx);`);
        bodyLines.push(`      if (el && typeof el.compiledFn === 'function') return el.compiledFn(item, el.schema, ctx);`);
        bodyLines.push(`      return item;`);
        bodyLines.push(`    });`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    const el = schema["${escapedKey}"][0];`);
        bodyLines.push(`    if (typeof el === 'function') res["${escapedKey}"] = el(obj["${escapedKey}"], ctx);`);
        bodyLines.push(`    else if (el && typeof el.compiledFn === 'function') res["${escapedKey}"] = el.compiledFn(obj["${escapedKey}"], el.schema, ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && typeof field.compiledFn === 'function') {
        bodyLines.push(`if (obj["${escapedKey}"] !== undefined && obj["${escapedKey}"] !== null) {`);
        bodyLines.push(`  if (Array.isArray(obj["${escapedKey}"])) {`);
        bodyLines.push(`    res["${escapedKey}"] = obj["${escapedKey}"].map(function(item) { return schema["${escapedKey}"].compiledFn(item, schema["${escapedKey}"].schema, ctx); });`);
        bodyLines.push(`  } else {`);
        bodyLines.push(`    res["${escapedKey}"] = schema["${escapedKey}"].compiledFn(obj["${escapedKey}"], schema["${escapedKey}"].schema, ctx);`);
        bodyLines.push(`  }`);
        bodyLines.push(`}`);
      } else if (field && typeof field === 'object') {
        // Automatically compile nested object literal
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

export interface ObjectMaskerCallable<TSchema extends Record<string, any>> {
  (value: any, ctx?: MaskContext): any;
  schema: TSchema;
  compiledFn: (obj: any, schema: any, ctx: MaskContext) => any;
}

export function object<TSchema extends Record<string, any>>(
  schema: TSchema
): ObjectMaskerCallable<TSchema> {
  const instance = new ObjectMasker(schema);
  const callable = (val: any, ctx?: MaskContext) => instance.call(val, ctx);
  callable.schema = instance.schema;
  callable.compiledFn = instance.compiledFn;
  return callable as unknown as ObjectMaskerCallable<TSchema>;
}
