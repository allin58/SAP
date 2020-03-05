namespace sap.capire.airport;
using { sap.capire.airport as schema } from './schema';

extend schema.Airport with {
    amount : Integer;
    pilotName  : String(111);
}
