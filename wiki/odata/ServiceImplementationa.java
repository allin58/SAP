package com.example.odata.DemoService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.sap.cloud.sdk.service.prov.api.operations.Query;
import com.sap.cloud.sdk.service.prov.api.operations.Read;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;
import com.sap.cloud.sdk.service.prov.api.request.ReadRequest;
import com.sap.cloud.sdk.service.prov.api.response.QueryResponse;
import com.sap.cloud.sdk.service.prov.api.response.ReadResponse;

public class ServiceImplementation {
	
	/*
	 * @Read(serviceName="DemoService", entity="People") public ReadResponse
	 * getPerson(ReadRequest request) {
	 * 
	 * Map<String, Object> map = new HashMap<String, Object>(); map.put("UniqueId",
	 * 1); map.put("Name", "Kitty");
	 * 
	 * return ReadResponse.setSuccess().setData(map).response(); }
	 */
	
	@Query(serviceName="DemoService", entity="People")
	public QueryResponse getPeople(QueryRequest request) {

		List<Map<String, Object>> peopleMap = getPeople();

		return QueryResponse.setSuccess().setDataAsMap(peopleMap).response();
	}
	
	
	private List<Map<String, Object>> getPeople(){
		List<Map<String, Object>> peopleMap = new ArrayList<Map<String, Object>>();
			
		peopleMap.add(createPerson(0, "Anna"));
		peopleMap.add(createPerson(1, "Berta"));
		peopleMap.add(createPerson(2, "Claudia"));
		peopleMap.add(createPerson(3, "Debbie"));
			
		return peopleMap;
	}
		
	private Map<String, Object> createPerson(int id, String name){
		Map<String, Object> personMap = new HashMap<String, Object>();
			
		personMap.put("UniqueId", id);
		personMap.put("Name", name);
			
		return personMap;
	}
	

}
