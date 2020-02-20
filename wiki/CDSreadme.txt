using {ConfigurationService.Configuration as conf} from './pptl-configuration-api';


using { my.bookshop, sap.common } from '../db/data-model';

service CatalogService {
  entity Books @readonly as projection on bookshop.Books;
  entity Authors @readonly as projection on bookshop.Authors;
  entity Orders @insertonly as projection on bookshop.Orders;
  entity Test as projection on bookshop.Test;                  <----------------
}


cds init bookshop && cd bookshop
cds build
cds watch

cds srv/cat-service.cds -2 edmx -> генерит metadata csn


деплой на локальной базе
npm add sqlite3 -D
cds deploy --to sqlite:my.db


деплой на HANA







