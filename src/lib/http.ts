import {NextResponse} from "next/server";
export const failure=(message:string,status=400)=>NextResponse.json({error:message},{status});
export const noStore=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function parseJson(request:Request){try{return await request.json()}catch{return null}}
