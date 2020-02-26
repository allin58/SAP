namespace sap.capire.bookshop;
using { Currency, managed, cuid } from '@sap/cds/common';

entity Plane: managed {
  key ID : Integer;
  descr  : localized String(1111);
 
}

entity Pilot : managed {
  key ID : Integer;
  name   : String(111);
  dateOfBirth  : Date;
  placeOfBirth : String;
  
}


