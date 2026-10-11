import {liveCourses} from "@/lib/catalog-server";
import {noStore,failure} from "@/lib/http";
export async function GET(){try{return noStore({courses:await liveCourses()})}catch{return failure('Unable to load the course catalogue',503)}}
