using { sap.capire.bookshop as my } from '../db/schema';


service CatalogService {

 @insertonly entity Books @readonly as projection on my.Books;
 @insertonly entity Authors @readonly as projection on my.Authors; 
 @insertonly entity Orders as projection on my.Orders; 

}
