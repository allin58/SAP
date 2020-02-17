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

	// static lists representing dummy database tables
	private static final List<Map<String, Object>> peopleList = new ArrayList<Map<String, Object>>();
	private static final List<Map<String, Object>> jobList = new ArrayList<Map<String, Object>>();



	@Query(serviceName="DemoService", entity="People")
	public QueryResponse getPeople(QueryRequest request) {
		List<Map<String, Object>> peopleList = getAllPeople();
		return QueryResponse.setSuccess().setDataAsMap(peopleList).response();
	}

	@Query(serviceName="DemoService", entity="Jobs")
	public QueryResponse getJobs(QueryRequest request) {
		List<Map<String, Object>> jobList = getAllJobs();
		return QueryResponse.setSuccess().setDataAsMap(jobList).response();
	}

	@Read(serviceName="DemoService", entity="People")
	public ReadResponse getPerson(ReadRequest request) {
		Integer id = (Integer) request.getKeys().get("PersonId");
		Map<String, Object> personMap = findPerson(id);
		return ReadResponse.setSuccess().setData(personMap).response();
	}

	@Read(serviceName="DemoService", entity="Jobs")
	public ReadResponse getJob(ReadRequest request) {
		Integer id = (Integer) request.getKeys().get("JobId");
		Map<String, Object> jobMap = findJob(id);
		return ReadResponse.setSuccess().setData(jobMap).response();
	}


	/* NAVIGATION */

	// Navigation from one person to one Job
	// Example URI: srv/people(1)/Occupation
	@Read(serviceName = "DemoService", entity = "Jobs", sourceEntity = "People")
	public ReadResponse getJobForPerson(ReadRequest request) {

		Integer personId = (Integer) request.getSourceKeys().get("PersonId");
		Map<String, Object> personMap = findPerson(personId);

		Integer jobId = (Integer) personMap.get("JobId");
		Map<String, Object> jobMap = findJob(jobId);

		return ReadResponse.setSuccess().setData(jobMap).response();
	}

	// Navigation from one job to all people who have this job.
	// Example URI: /srv/Jobs(1)/Employees
	@Query(serviceName = "DemoService", entity = "People", sourceEntity = "Jobs")
	public QueryResponse getPeopleForJob(QueryRequest request) {
		List<Map<String,Object>> responsePeopleList = new ArrayList<Map<String, Object>>();

		Integer jobId = (Integer) request.getSourceKeys().get("JobId");

		List<Map<String,Object>> allPeopleList = getAllPeople();
		for(Map<String, Object> personMap : allPeopleList) {
			if(((Integer)personMap.get("JobId")).equals(jobId)) {
				responsePeopleList.add(personMap);
			}
		}

		return QueryResponse.setSuccess().setDataAsMap(responsePeopleList).response();
	}


	/* DUMMY DATABASE */

	private List<Map<String, Object>> getAllPeople(){
		if(peopleList.isEmpty()) {
			createPerson(1, "Anna", 1);
			createPerson(2, "Berta", 1);
			createPerson(3, "Claudia", 2);
			createPerson(4, "Debbie", 2);
		}

		return peopleList;
	}

	private Map<String, Object> createPerson(Integer personId, String name, Integer jobId){
		Map<String, Object> personMap = new HashMap<String, Object>();
		personMap.put("PersonId", personId);
		personMap.put("Name", name);
		personMap.put("JobId", jobId);
		peopleList.add(personMap);

		return personMap;
	}


	// used for READ operation. Go through the list and find the person with requested PersonId
	private Map<String, Object> findPerson(Integer requiredPersonId){
		List<Map<String,Object>> peopleList = getAllPeople();
		for(Map<String, Object> personMap : peopleList) {
			if(((Integer)personMap.get("PersonId")).equals(requiredPersonId)) {
				return personMap;
			}
		}
		return null;
	}


	private List<Map<String, Object>> getAllJobs(){
		if(jobList.isEmpty()) {
			createJob(1, "Software Engineer");
			createJob(2, "Musician");
			createJob(3, "Architect");
		}
		return jobList;
	}

	private Map<String, Object>  createJob(Integer jobId, String name){
		Map<String, Object> jobMap = new HashMap<String, Object>();
		jobMap.put("JobId", jobId);
		jobMap.put("JobName", name);
		jobList.add(jobMap);

		return jobMap;
	}

	private Map<String, Object> findJob(Integer requiredJobId){
		List<Map<String,Object>> jobList = getAllJobs();
		for(Map<String, Object> jobMap : jobList) {
			if(((Integer)jobMap.get("JobId")).equals(requiredJobId)) {
				return jobMap;
			}
		}
		return null;
	}
}