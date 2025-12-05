import requests
import sys
import json
from datetime import datetime

class BusinessIntegrationTester:
    def __init__(self, base_url="https://invo-metrics.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.business_ids = []
        self.customer_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                self.tests_failed += 1
                self.failed_tests.append(f"{name} - Expected {expected_status}, got {response.status_code}")
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass

            return False, {}

        except Exception as e:
            self.failed_tests.append(f"{name} - Error: {str(e)}")
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_customer_without_business(self):
        """Test creating customer without business"""
        print("\n=== TEST 1: Customer WITHOUT Business ===")
        
        customer_data = {
            "name": "Alice Johnson",
            "nickname": "Alice",
            "phone_1": "9876543210",
            "email_1": "alice@example.com",
            "address_1": "123 Main Street",
            "city_1": "Mumbai",
            "state_1": "Maharashtra",
            "pincode_1": "400001",
            "has_business_with_gst": False
        }
        
        success, response = self.run_test(
            "Create Customer WITHOUT Business",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if success:
            # Verify business_name is set to "NA"
            if response.get('business_name') == "NA":
                print("✅ business_name correctly set to 'NA'")
                self.tests_passed += 1
            else:
                print(f"❌ business_name should be 'NA', got: {response.get('business_name')}")
                self.failed_tests.append("Customer without business - business_name not set to 'NA'")
            
            # Verify business_id is None
            if response.get('business_id') is None:
                print("✅ business_id correctly set to None")
                self.tests_passed += 1
            else:
                print(f"❌ business_id should be None, got: {response.get('business_id')}")
                self.failed_tests.append("Customer without business - business_id not None")
            
            self.customer_ids.append(response.get('id'))
            self.tests_run += 2  # For the two verification checks
        
        return success

    def test_customer_with_new_business(self):
        """Test creating customer with new business"""
        print("\n=== TEST 2: Customer WITH New Business ===")
        
        customer_data = {
            "name": "Bob Smith",
            "nickname": "Bob",
            "phone_1": "9876543211",
            "email_1": "bob@example.com",
            "address_1": "456 Business Street",
            "city_1": "Delhi",
            "state_1": "Delhi",
            "pincode_1": "110001",
            "has_business_with_gst": True,
            "business_data": {
                "legal_name": "Bob's Sports Emporium",
                "nickname": "BSE",
                "gstin": "07ABCDE1234F1Z5",
                "state_code": "07",
                "state": "Delhi",
                "city": "Delhi",
                "pan": "ABCDE1234F",
                "phone_1": "9876543211",
                "email_1": "business@bobsports.com",
                "address_1": "456 Business Street, Delhi"
            }
        }
        
        success, response = self.run_test(
            "Create Customer WITH New Business",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if success:
            # Verify business was created and linked
            business_id = response.get('business_id')
            business_name = response.get('business_name')
            
            if business_id:
                print(f"✅ business_id assigned: {business_id}")
                self.business_ids.append(business_id)
                self.tests_passed += 1
            else:
                print("❌ business_id not assigned")
                self.failed_tests.append("Customer with new business - business_id not assigned")
            
            if business_name == "Bob's Sports Emporium":
                print(f"✅ business_name correctly set: {business_name}")
                self.tests_passed += 1
            else:
                print(f"❌ business_name incorrect, expected 'Bob's Sports Emporium', got: {business_name}")
                self.failed_tests.append("Customer with new business - business_name incorrect")
            
            self.customer_ids.append(response.get('id'))
            self.tests_run += 2  # For the two verification checks
            
            # Verify business exists in businesses collection
            if business_id:
                success_biz, biz_response = self.run_test(
                    "Verify Business Created in Collection",
                    "GET",
                    f"businesses/{business_id}",
                    200
                )
                
                if success_biz and biz_response.get('gstin') == "07ABCDE1234F1Z5":
                    print("✅ Business correctly created in businesses collection")
                    self.tests_passed += 1
                else:
                    print("❌ Business not found in businesses collection")
                    self.failed_tests.append("Business not created in collection")
                self.tests_run += 1
        
        return success

    def test_customer_with_existing_business(self):
        """Test creating customer linking to existing business"""
        print("\n=== TEST 3: Customer Linking to Existing Business ===")
        
        # First create a business directly
        business_data = {
            "legal_name": "Existing Sports Store",
            "nickname": "ESS",
            "gstin": "27ABCDE5678G1Z5",
            "state_code": "27",
            "state": "Maharashtra",
            "city": "Mumbai",
            "pan": "ABCDE5678G",
            "phone_1": "9876543212",
            "email_1": "existing@sportsstore.com",
            "address_1": "789 Existing Street, Mumbai"
        }
        
        success, biz_response = self.run_test(
            "Create Business Directly",
            "POST",
            "businesses",
            200,
            data=business_data
        )
        
        if not success:
            return False
        
        existing_business_id = biz_response.get('id')
        self.business_ids.append(existing_business_id)
        
        # Now create customer with same GSTIN
        customer_data = {
            "name": "Charlie Brown",
            "nickname": "Charlie",
            "phone_1": "9876543213",
            "email_1": "charlie@example.com",
            "address_1": "321 Customer Avenue",
            "city_1": "Mumbai",
            "state_1": "Maharashtra",
            "pincode_1": "400002",
            "has_business_with_gst": True,
            "business_data": {
                "legal_name": "Some Other Name",  # This should be ignored
                "gstin": "27ABCDE5678G1Z5",  # Same GSTIN as existing business
                "state": "Maharashtra",
                "city": "Mumbai"
            }
        }
        
        success, response = self.run_test(
            "Create Customer Linking to Existing Business",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if success:
            # Verify customer linked to existing business (not created new one)
            customer_business_id = response.get('business_id')
            customer_business_name = response.get('business_name')
            
            if customer_business_id == existing_business_id:
                print(f"✅ Customer linked to existing business: {customer_business_id}")
                self.tests_passed += 1
            else:
                print(f"❌ Customer not linked to existing business. Expected: {existing_business_id}, Got: {customer_business_id}")
                self.failed_tests.append("Customer not linked to existing business")
            
            if customer_business_name == "Existing Sports Store":
                print(f"✅ business_name from existing business: {customer_business_name}")
                self.tests_passed += 1
            else:
                print(f"❌ business_name incorrect. Expected: 'Existing Sports Store', Got: {customer_business_name}")
                self.failed_tests.append("business_name not from existing business")
            
            self.customer_ids.append(response.get('id'))
            self.tests_run += 2
        
        return success

    def test_update_customer_add_business(self):
        """Test updating customer to add business"""
        print("\n=== TEST 4: Update Customer to Add Business ===")
        
        if not self.customer_ids:
            print("❌ No customer available for update test")
            return False
        
        customer_id = self.customer_ids[0]  # Use first customer (Alice - no business)
        
        update_data = {
            "name": "Alice Johnson",
            "nickname": "Alice",
            "phone_1": "9876543210",
            "email_1": "alice@example.com",
            "address_1": "123 Main Street",
            "city_1": "Mumbai",
            "state_1": "Maharashtra",
            "pincode_1": "400001",
            "has_business_with_gst": True,
            "business_data": {
                "legal_name": "Alice's Fashion Hub",
                "nickname": "AFH",
                "gstin": "27ALICE1234F1Z5",
                "state_code": "27",
                "state": "Maharashtra",
                "city": "Mumbai",
                "pan": "ALICE1234F",
                "phone_1": "9876543210",
                "email_1": "alice@fashionhub.com",
                "address_1": "123 Main Street, Mumbai"
            }
        }
        
        success, response = self.run_test(
            "Update Customer to Add Business",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data
        )
        
        if success:
            # Verify business was created and linked
            business_id = response.get('business_id')
            business_name = response.get('business_name')
            
            if business_id:
                print(f"✅ business_id assigned after update: {business_id}")
                self.business_ids.append(business_id)
                self.tests_passed += 1
            else:
                print("❌ business_id not assigned after update")
                self.failed_tests.append("Update customer - business_id not assigned")
            
            if business_name == "Alice's Fashion Hub":
                print(f"✅ business_name correctly updated: {business_name}")
                self.tests_passed += 1
            else:
                print(f"❌ business_name incorrect after update, expected 'Alice's Fashion Hub', got: {business_name}")
                self.failed_tests.append("Update customer - business_name incorrect")
            
            self.tests_run += 2
        
        return success

    def test_update_customer_unlink_business(self):
        """Test updating customer to unlink business"""
        print("\n=== TEST 5: Update Customer to Unlink Business ===")
        
        if len(self.customer_ids) < 2:
            print("❌ No customer with business available for unlink test")
            return False
        
        customer_id = self.customer_ids[1]  # Use second customer (Bob - has business)
        
        update_data = {
            "name": "Bob Smith",
            "nickname": "Bob",
            "phone_1": "9876543211",
            "email_1": "bob@example.com",
            "address_1": "456 Business Street",
            "city_1": "Delhi",
            "state_1": "Delhi",
            "pincode_1": "110001",
            "has_business_with_gst": False  # Unlink business
        }
        
        success, response = self.run_test(
            "Update Customer to Unlink Business",
            "PUT",
            f"customers/{customer_id}",
            200,
            data=update_data
        )
        
        if success:
            # Verify business was unlinked
            business_id = response.get('business_id')
            business_name = response.get('business_name')
            
            if business_id is None:
                print("✅ business_id correctly set to None")
                self.tests_passed += 1
            else:
                print(f"❌ business_id should be None after unlinking, got: {business_id}")
                self.failed_tests.append("Unlink business - business_id not None")
            
            if business_name == "NA":
                print("✅ business_name correctly set to 'NA'")
                self.tests_passed += 1
            else:
                print(f"❌ business_name should be 'NA' after unlinking, got: {business_name}")
                self.failed_tests.append("Unlink business - business_name not 'NA'")
            
            self.tests_run += 2
        
        return success

    def test_businesses_with_linked_customers(self):
        """Test that businesses endpoint returns linked customers"""
        print("\n=== TEST 6: Businesses with Linked Customers ===")
        
        success, response = self.run_test(
            "Get Businesses with Linked Customers",
            "GET",
            "businesses",
            200
        )
        
        if success and isinstance(response, list):
            print(f"✅ Retrieved {len(response)} businesses")
            
            # Check if businesses have linked_customers and linked_customers_count
            businesses_with_customers = 0
            for business in response:
                if 'linked_customers' in business and 'linked_customers_count' in business:
                    businesses_with_customers += 1
                    if business['linked_customers_count'] > 0:
                        print(f"✅ Business '{business.get('legal_name')}' has {business['linked_customers_count']} linked customers: {business['linked_customers']}")
                else:
                    print(f"❌ Business '{business.get('legal_name')}' missing linked_customers fields")
                    self.failed_tests.append(f"Business missing linked_customers fields: {business.get('legal_name')}")
            
            if businesses_with_customers == len(response):
                print("✅ All businesses have linked_customers fields")
                self.tests_passed += 1
            else:
                print(f"❌ {len(response) - businesses_with_customers} businesses missing linked_customers fields")
                self.failed_tests.append("Some businesses missing linked_customers fields")
            
            self.tests_run += 1
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== CLEANUP ===")
        
        # Delete test customers
        for customer_id in self.customer_ids:
            try:
                requests.delete(f"{self.base_url}/customers/{customer_id}")
                print(f"🗑️ Deleted customer: {customer_id}")
            except:
                pass
        
        # Delete test businesses
        for business_id in self.business_ids:
            try:
                requests.delete(f"{self.base_url}/businesses/{business_id}")
                print(f"🗑️ Deleted business: {business_id}")
            except:
                pass

def main():
    print("🚀 Starting Business Integration Tests")
    print("=" * 60)
    
    tester = BusinessIntegrationTester()
    
    # Run all tests in sequence
    tests = [
        tester.test_customer_without_business,
        tester.test_customer_with_new_business,
        tester.test_customer_with_existing_business,
        tester.test_update_customer_add_business,
        tester.test_update_customer_unlink_business,
        tester.test_businesses_with_linked_customers
    ]
    
    all_passed = True
    for test in tests:
        try:
            result = test()
            if not result:
                all_passed = False
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.failed_tests.append(f"Exception in {test.__name__}: {str(e)}")
            all_passed = False
    
    # Clean up test data
    tester.cleanup_test_data()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS ({len(tester.failed_tests)}):")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"  {i}. {failure}")
    
    if all_passed and tester.tests_passed == tester.tests_run:
        print("🎉 All business integration tests passed!")
        return 0
    else:
        print(f"⚠️ {len(tester.failed_tests)} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())