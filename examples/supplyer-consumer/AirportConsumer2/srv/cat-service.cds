using { CatalogService as api } from './external/csn/airport';


service CatalogService2 {

 entity Plane @readonly as projection on api.Plane
 entity Pilot  @readonly as projection on api.Pilot
 

}
