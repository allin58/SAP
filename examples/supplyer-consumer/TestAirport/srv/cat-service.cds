using { sap.capire.bookshop as my } from '../db/schema';


service CatalogService {

 @insertonly entity Plane @readonly as projection on my.Plane
 @insertonly entity Pilot  @readonly as projection on my.Pilot  
 

}
