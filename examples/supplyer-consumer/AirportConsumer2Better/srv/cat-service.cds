using {CatalogService as api } from './external/csn/airport';
//using { sap.capire.airport as api2 } from '../db/schema';
using { sap.capire.airport as api2} from '../db/schema2';


service AirPortService {
  entity Airports as projection on api2.Airport;
}

service CatalogService2 {
 entity Planes @readonly as projection on api.Plane;
 entity Pilots  @readonly as projection on api.Pilot;
 entity EvenPilots  @readonly as projection on api.Pilot;
  entity CustomPilots  @readonly as projection on api.Pilot;
 
}


