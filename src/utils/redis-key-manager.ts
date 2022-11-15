const IGNORE_THRESHOLD = 3; // seconds


export async function addIgnore_(id:string, side:string,
    client:any, ignore_threshold?:any): Promise<any> {
  const key = `${id}_ignore_${side}`;
  return await client.set(key, 1, "EX", ignore_threshold || IGNORE_THRESHOLD);
}

export async function shouldIgnore_(id:string,
    side:string, client:any) : Promise<any> {
  const key = `${id}_ignore_${side}`;
  return await client.get(key);
}
