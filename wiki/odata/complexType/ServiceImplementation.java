package com.example.odata.DemoService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sap.cloud.sdk.service.prov.api.operations.Create;
import com.sap.cloud.sdk.service.prov.api.operations.Query;
import com.sap.cloud.sdk.service.prov.api.request.CreateRequest;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;
import com.sap.cloud.sdk.service.prov.api.response.CreateResponse;
import com.sap.cloud.sdk.service.prov.api.response.QueryResponse;

public class ServiceImplementation {

	private static final List<Map<String, Object>> peopleList = new ArrayList<Map<String, Object>>();


	@Query(serviceName="DemoService", entity="People")
	public QueryResponse getPeople(QueryRequest request) {
		List<Map<String, Object>> peopleMap = getPeople();
		return QueryResponse.setSuccess().setDataAsMap(peopleMap).response();
	}


	@Create(serviceName = "DemoService", entity = "People")
	public CreateResponse createPerson(CreateRequest request) {
		Map<String, Object> requestBody = request.getMapData();

		// entity type properties for "Person"
		int idToCreate = (int) requestBody.get("UniqueId");
		String nameToCreate = (String) requestBody.get("Name");
		Map<String, Object> homeAddress = (Map<String, Object>) requestBody.get("HomeAddress");

		// complex type properties for "HomeAddress"
		String cityToCreate = (String) homeAddress.get("City");
		String streetToCreate = (String) homeAddress.get("Street");
		int numberToCreate = (int) homeAddress.get("Number");

		// do the actual creation in database
		createPerson(idToCreate, nameToCreate, createAddress(cityToCreate, streetToCreate, numberToCreate));

		return CreateResponse.setSuccess().response();
	}



	/* Dummy Data Store */


	private List<Map<String, Object>> getPeople(){
		if(peopleList.isEmpty()) {
			createPerson(0, "Anna", createAddress("New York", "5th Avenue", 122));
			createPerson(1, "Berta", createAddress("Mami", "Beach Avenue", 45));
			createPerson(2, "Claudia", createAddress("Las Vegas", "Hopeful Avenue", 1));
			createPerson(3, "Debbie", createAddress("New York", "6th Avenue", 133));
		}

		return peopleList;
	}

	private Map<String, Object> createAddress(String cityName, String streetName, int number){

		Map<String, Object> addressMap = new HashMap<String, Object>();
		addressMap.put("City", cityName);
		addressMap.put("Street", streetName);
		addressMap.put("Number", number);

		return addressMap;
	}

	private void createPerson(int id, String name, Map<String, Object> addressMap){

		Map<String, Object> personMap = new HashMap<String, Object>();
		personMap.put("UniqueId", id);
		personMap.put("Name", name);
		personMap.put("HomeAddress", addressMap);

		peopleList.add(personMap);
	}

}