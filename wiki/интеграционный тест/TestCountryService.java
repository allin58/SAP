package my.company;

import com.burberry.pptl.odata.po.manage.service.CountryService;
import com.burberry.pptl.odata.po.manage.service.extension.country.CountryHelper;
import com.burberry.pptl.odata.po.manage.service.helpers.EntityHelper;
import com.burberry.pptl.odata.po.manage.service.helpers.QueryBuilder;
import com.burberry.pptl.odata.po.manage.vdm.namespaces.pptlafs.Country;
import com.sap.cloud.sdk.odatav2.connectivity.ODataQuery;
import com.sap.cloud.sdk.odatav2.connectivity.ODataQueryBuilder;
import com.sap.cloud.sdk.testutil.ErpSystem;
import com.sap.cloud.sdk.testutil.MockErpDestination;
import com.sap.cloud.sdk.testutil.MockUtil;
import io.restassured.RestAssured;
import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.arquillian.test.api.ArquillianResource;
import org.jboss.shrinkwrap.api.spec.WebArchive;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import java.net.URL;
import java.util.Arrays;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;

import static org.junit.Assert.assertEquals;

@RunWith(Arquillian.class)
public class TestCountryService {

    private static final MockUtil mockUtil = new MockUtil();
    private static final Logger logger = LoggerFactory.getLogger(CountryService.class);



    @ArquillianResource
    private URL baseUrl;


    @Deployment
    public static WebArchive createDeployment() {
        return TestUtil.createDeployment(CountryService.class);
    }


    @BeforeClass
    public static void beforeClass() {
        mockUtil.mockDefaults();
        mockUtil.mockErpDestination("mock-destination","ERP_001");


    }


    @Before
    public void before() {
        RestAssured.baseURI = baseUrl.toExternalForm();
    }

    @Test
    public void testService() throws Exception {

        CountryHelper HELPER = CountryHelper.getInstance();
        Deque<EntityHelper> helpersQueue = new LinkedList<EntityHelper>();
        helpersQueue.addLast(HELPER);

        ODataQuery oDataQuery = ODataQueryBuilder
                .withEntity(helpersQueue.getFirst().getDestinationRelativePath(), helpersQueue.getFirst().getNameOnDestination())
                .inlineCount()
                .select(QueryBuilder.handleSelects(Arrays.asList("CountryName"), helpersQueue))
                .build();

        List<Country> countries = oDataQuery
                .execute("mock-destination")
                .asList(Country.class);



         assertEquals(countries.get(0).getCountryName(),"Andorra");
         assertEquals(countries.get(1).getCountryName(),"Utd.Arab Emir.");
         assertEquals(countries.get(2).getCountryName(),"Antigua/Barbuda");
         assertEquals(countries.get(3).getCountryName(),"Anguilla");
         assertEquals(countries.get(4).getCountryName(),"Albania");
         assertEquals(countries.get(5).getCountryName(),"Armenia");
    }
}
