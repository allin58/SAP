namespace sap.capire.airport;
using { managed, cuid } from '@sap/cds/common';

entity Airport: managed {
  key ID : Integer;
  city  : String(111);
}


