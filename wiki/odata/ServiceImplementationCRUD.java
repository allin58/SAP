package com.example.odata.DemoService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.cloud.sdk.service.prov.api.operations.Create;
import com.sap.cloud.sdk.service.prov.api.operations.Delete;
import com.sap.cloud.sdk.service.prov.api.operations.Query;
import com.sap.cloud.sdk.service.prov.api.operations.Read;
import com.sap.cloud.sdk.service.prov.api.operations.Update;
import com.sap.cloud.sdk.service.prov.api.request.CreateRequest;
import com.sap.cloud.sdk.service.prov.api.request.DeleteRequest;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;
import com.sap.cloud.sdk.service.prov.api.request.ReadRequest;
import com.sap.cloud.sdk.service.prov.api.request.UpdateRequest;
import com.sap.cloud.sdk.service.prov.api.response.CreateResponse;
import com.sap.cloud.sdk.service.prov.api.response.DeleteResponse;
import com.sap.cloud.sdk.service.prov.api.response.ErrorResponse;
import com.sap.cloud.sdk.service.prov.api.response.QueryResponse;
import com.sap.cloud.sdk.service.prov.api.response.ReadResponse;
import com.sap.cloud.sdk.service.prov.api.response.UpdateResponse;

public class ServiceImplementation {


	private static List<Map<String, Object>> peopleList = null;


	@Query(serviceName="DemoService", entity="People")
	public QueryResponse getPeople(QueryRequest request) {
		List<Map<String, Object>> peopleMap = getPeople();
		return QueryResponse.setSuccess().setDataAsMap(peopleMap).response();
	}

	@Read(serviceName="DemoService", entity="People")
	public ReadResponse getPerson(ReadRequest request) {
		Integer id = (Integer)request.getKeys().get("UniqueId");
		Map<String, Object> personMap = findPerson(id);
		return ReadResponse.setSuccess().setData(personMap).response();
	}



	@Create(serviceName = "DemoService", entity = "People")
	public CreateResponse createPerson(CreateRequest request) {

		// extract the data for creation
		Map<String, Object> requestBody = request.getMapData();
		Integer idToCreate = (Integer) requestBody.get("UniqueId");  // we know it is an int, because we know the edmx
		String nameToCreate = (String) requestBody.get("Name"); // same here

		// do the actual creation in database
		createPerson(idToCreate, nameToCreate);

		return CreateResponse.setSuccess().response();
	}



	@Update(serviceName = "DemoService", entity = "People")
	public UpdateResponse updatePerson(UpdateRequest request) {

		// retrieve from request: which person to update
		Integer idForUpdate = (Integer)request.getKeys().get("UniqueId");

		// retrieve from request: the data to modify
		Map<String, Object> requestBody = request.getMapData();

		// retrieve from database: the person to modify
		Map<String, Object> personMap = findPerson(idForUpdate);

		// do the modification, but ignore key property (cannot be modified, to keep data consistent)
		personMap.replace("Name", requestBody.get("Name"));

		return UpdateResponse.setSuccess().response();
	}


	@Delete(serviceName = "DemoService", entity = "People")
	public DeleteResponse deletePerson(DeleteRequest request) {
		Integer id = (Integer)request.getKeys().get("UniqueId");

		//find and remove the requested person
		List<Map<String,Object>> peopleList = getPeople();
		for (Iterator<Map<String, Object>> iterator = peopleList.iterator(); iterator.hasNext();) {
			Map<String, Object> personMap = iterator.next();
			if(((Integer)personMap.get("UniqueId")).equals(id)) {
				iterator.remove();
				break;
			}
		}

		return DeleteResponse.setSuccess().response();
	}



	/* Dummy Data Store */


	private List<Map<String, Object>> getPeople(){

		// init the "database"
		if(peopleList == null) {
			peopleList = new ArrayList<Map<String, Object>>();
			createPerson(0, "Anna");
			createPerson(1, "Berta");
			createPerson(2, "Claudia");
			createPerson(3, "Debbie");
		}

		return peopleList;
	}

	private void createPerson(Integer id, String name){
		Map<String, Object> personMap = new HashMap<String, Object>();
		personMap.put("UniqueId", id);
		personMap.put("Name", name);

		peopleList.add(personMap);
	}

	private Map<String, Object> findPerson(Integer requiredPersonId){
		List<Map<String,Object>> peopleList = getPeople();
		for(Map<String, Object> personMap : peopleList) {
			if(((Integer)personMap.get("UniqueId")).equals(requiredPersonId)) {
				return personMap;
			}
		}
		return null;
	}
}