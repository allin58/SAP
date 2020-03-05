package my.company;

import com.sap.cloud.sdk.cloudplatform.logging.CloudLoggerFactory;
import com.sap.cloud.sdk.odatav2.connectivity.ODataQueryBuilder;
import com.sap.cloud.sdk.s4hana.connectivity.ErpConfigContext;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Pilot;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane;
import com.sap.cloud.sdk.s4hana.datamodel.odata.services.DefaultMeataService;
import com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.ExtensionHelper;
import com.sap.cloud.sdk.service.prov.api.annotations.AfterQuery;
import com.sap.cloud.sdk.service.prov.api.annotations.AfterRead;
import com.sap.cloud.sdk.service.prov.api.operations.Query;
import com.sap.cloud.sdk.service.prov.api.operations.Read;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;
import com.sap.cloud.sdk.service.prov.api.request.ReadRequest;
import com.sap.cloud.sdk.service.prov.api.response.QueryResponse;
import com.sap.cloud.sdk.service.prov.api.response.QueryResponseAccessor;
import com.sap.cloud.sdk.service.prov.api.response.ReadResponse;
import com.sap.cloud.sdk.service.prov.api.response.ReadResponseAccessor;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;

public class ServiceImplementation {

	private static final Logger LOG = CloudLoggerFactory.getLogger(ServiceImplementation.class.getName());



	@Query(serviceName="CatalogService2", entity="Pilots")
	public QueryResponse getPilots(QueryRequest request) throws Exception {

		MeataService service = new DefaultMeataService();
		List<Pilot> pilots = service.getAllPilot().execute(new ErpConfigContext("airport-destination"));
		return QueryResponse.setSuccess().setData(pilots).response();
	}


	@Read(serviceName="CatalogService2", entity="Pilots")
	public ReadResponse getPilot(ReadRequest request) throws Exception {
		Integer id = (Integer) request.getKeys().get("ID");
		MeataService service = new DefaultMeataService();

		List<Pilot> pilots = service.getAllPilot().execute(new ErpConfigContext("airport-destination"));
		Pilot resPilot = null;
		for (Pilot pilot : pilots) {
			if ( pilot.getID().equals(id)) {
				resPilot = pilot;
			}
		}

		return ReadResponse.setSuccess().setData(resPilot).response();
	}


	@Query(serviceName="CatalogService2", entity="Planes")
	public QueryResponse getPlanes(QueryRequest request) throws Exception {
		MeataService service = new DefaultMeataService();
		List<Plane> planes = service.getAllPlane().execute(new ErpConfigContext("airport-destination"));
		return QueryResponse.setSuccess().setData(planes).response();
	}

	@Read(serviceName="CatalogService2", entity="Planes")
	public ReadResponse getPlane(ReadRequest request) throws Exception {
		Integer id = (Integer) request.getKeys().get("ID");
		MeataService service = new DefaultMeataService();
		List<Plane> planes = service.getAllPlane().execute(new ErpConfigContext("airport-destination"));
		Plane resPlane = null;
		for (Plane plane : planes) {
			if (plane.getID().equals(id)) {
				resPlane = plane;
			}
		}

		return ReadResponse.setSuccess().setData(resPlane).response();
	}





/*

	@BeforeRead(entity = "Pilots", serviceName = "CatalogService2")
	public BeforeReadResponse beforeReadPilots(ReadRequest req, ExtensionHelper h) {
		LOG.error("##### Orders - beforeReadOrders ########");
		return BeforeReadResponse.setSuccess().response();
	}

	@AfterRead(entity = "Pilots", serviceName = "CatalogService2")
	public ReadResponse afterReadPilots(ReadRequest req, ReadResponseAccessor res, ExtensionHelper h) {
		EntityData ed = res.getEntityData();
		EntityData ex = EntityData.getBuilder(ed).addElement("amount", 1000).buildEntityData("Airports");
		return ReadResponse.setSuccess().setData(ex).response();
	}

*/





	@Query(serviceName="CatalogService2", entity="EvenPilots")
	public QueryResponse getEvenPilots(QueryRequest request) throws Exception {
		MeataService service = new DefaultMeataService();
		List<Pilot> pilots = service.getAllPilot().execute(new ErpConfigContext("airport-destination"));
		List<Pilot> resultPilots = new ArrayList<>();
		for (Pilot pilot : pilots) {
			if (pilot.getID() % 2 == 0) {
				resultPilots.add(pilot);
			}
		}
		return QueryResponse.setSuccess().setData(resultPilots).response();
	}


	@Query(serviceName="CatalogService2", entity="CustomPilots")
	public QueryResponse getCustomPilots(QueryRequest request) throws Exception {
		//MeataService service = new DefaultMeataService();
		//List<Pilot> pilots = service.getAllPilot().execute(new ErpConfigContext("airport-destination"));
		//List<Pilot> resultPilots = new ArrayList<>();

		List<Pilot> pilots =
				new DefaultMeataService()
						.getAllPilot()
						.select(Pilot.ID,
								Pilot.NAME
								)
						//.filter(Pilot.NAME.eq("Bob"))
						.filter(Pilot.ID.gt(5))

						.execute(new ErpConfigContext("airport-destination"));



		return QueryResponse.setSuccess().setData(pilots).response();
	}




/*	@BeforeRead(entity = "Airports", serviceName = "AirPortService")
	public BeforeReadResponse beforeReadOrders(ReadRequest req, ExtensionHelper h) {
		LOG.error("##### Orders - beforeReadOrders ########");
		return BeforeReadResponse.setSuccess().response();
	}*/



	@AfterRead(entity = "Airports", serviceName = "AirPortService")
	public ReadResponse afterReadOrders(ReadRequest req, ReadResponseAccessor res, ExtensionHelper h) throws Exception{
		EntityData ed = res.getEntityData();
		//EntityData ex = EntityData.getBuilder(ed).addElement("amount", 1000).buildEntityData("Airport");
		MeataService service = new DefaultMeataService();

		Integer id = Integer.parseInt(ed.getMap().get("ID").toString());
		Pilot pilot = service.getPilotByKey(id).execute(new ErpConfigContext("airport-destination"));
		String name = pilot.getName();

		ed.getMap().put("pilotName", name);
		return ReadResponse.setSuccess().setData(ed).response();
	}




	@AfterQuery(entity = "Airports", serviceName = "AirPortService")
	public QueryResponse afterQueryOrders(QueryRequest req, QueryResponseAccessor res, ExtensionHelper h) {
		List<EntityData> dataList = res.getEntityDataList(); // original list
		List<EntityData> modifiedList = new ArrayList<EntityData>(dataList.size()); // modified list

		for (EntityData ed : dataList) {
			ed.getMap().put("amount", 1000);

			//EntityData ex = EntityData.getBuilder(ed).addElement("amount", 1000).buildEntityData("Airports");
			//dataList.add(ex);
		}

		return QueryResponse.setSuccess().setData(dataList).response();
	}





/*	@AfterQuery(entity = "Orders", serviceName = "CatalogService")
	public QueryResponse afterQueryOrders(QueryRequest req, QueryResponseAccessor res, ExtensionHelper h) {
		List<EntityData> dataList = res.getEntityDataList(); // original list
		List<EntityData> modifiedList = new ArrayList<EntityData>(dataList.size()); // modified list
		for (EntityData ed : dataList) {
			EntityData ex = EntityData.getBuilder(ed).addElement("amount", 1000).buildEntityData("Orders");
			modifiedList.add(ex);
		}
		return QueryResponse.setSuccess().setData(modifiedList).response();
	}*/




	/*final ErpConfigContext configContext = new ErpConfigContext();
	final List<MyBusinessPartnerType> businessPartners = ODataQueryBuilder
			.withEntity("/sap/opu/odata/sap/API_BUSINESS_PARTNER",
					"A_BusinessPartner")
			.select("BusinessPartner",
					"LastName",
					"FirstName",
					"IsMale",
					"IsFemale",
					"CreationDate")
			.build()
			.execute(configContext)
			.asList(MyBusinessPartnerType.class);*/


	/*final List<BusinessPartner> businessPartners =
			new DefaultBusinessPartnerService()
					.getAllBusinessPartner()
					.select(BusinessPartner.BUSINESS_PARTNER,
							BusinessPartner.LAST_NAME,
							BusinessPartner.FIRST_NAME,
							BusinessPartner.IS_MALE,
							BusinessPartner.IS_FEMALE,
							BusinessPartner.CREATION_DATE)
					.execute();*/



	/*final List<BusinessPartner> businessPartners =
			new DefaultBusinessPartnerService()
					.getAllBusinessPartner()
					.select(BusinessPartner.BUSINESS_PARTNER,
							BusinessPartner.LAST_NAME,
							BusinessPartner.FIRST_NAME,
							BusinessPartner.IS_MALE,
							BusinessPartner.IS_FEMALE,
							BusinessPartner.CREATION_DATE)
					.filter(BusinessPartner.BUSINESS_PARTNER_CATEGORY.eq(CATEGORY_PERSON))
					.orderBy(BusinessPartner.LAST_NAME, Order.ASC)
					.top(10)
					.execute();*/


}