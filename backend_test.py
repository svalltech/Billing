import requests
import sys
import json
from datetime import datetime

class BillingAPITester:
    def __init__(self, base_url="https://fitbilling.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.business_id = None
        self.customer_id = None
        self.product_id = None
        self.invoice_id = None

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
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_business_operations(self):
        """Test business CRUD operations"""
        print("\n=== BUSINESS OPERATIONS ===")
        
        # Test create business
        business_data = {
            "legal_name": "Test Sports Store",
            "nickname": "TSS",
            "gstin": "27ABCDE1234F1Z5",
            "state_code": "27",
            "state": "Maharashtra",
            "pan": "ABCDE1234F",
            "phone_1": "9876543210",
            "email_1": "test@sportstore.com",
            "address_1": "123 Sports Street, Mumbai"
        }
        
        success, response = self.run_test(
            "Create/Update Business",
            "POST",
            "business",
            200,
            data=business_data
        )
        
        if success and 'id' in response:
            self.business_id = response['id']
            print(f"Business ID: {self.business_id}")
        
        # Test get business
        success, response = self.run_test(
            "Get Business",
            "GET",
            "business",
            200
        )
        
        return success

    def test_customer_operations(self):
        """Test customer CRUD operations"""
        print("\n=== CUSTOMER OPERATIONS ===")
        
        # Test create customer
        customer_data = {
            "name": "John Doe",
            "nickname": "Johnny",
            "gstin": "27ABCDE5678G1Z5",
            "phone_1": "9876543211",
            "email_1": "john@example.com",
            "address_1": "456 Customer Lane, Mumbai"
        }
        
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        
        if success and 'id' in response:
            self.customer_id = response['id']
            print(f"Customer ID: {self.customer_id}")
        
        # Test get all customers
        success, response = self.run_test(
            "Get All Customers",
            "GET",
            "customers",
            200
        )
        
        # Test search customers
        success, response = self.run_test(
            "Search Customers",
            "GET",
            "customers",
            200,
            params={"search": "John"}
        )
        
        # Test get specific customer
        if self.customer_id:
            success, response = self.run_test(
                "Get Customer by ID",
                "GET",
                f"customers/{self.customer_id}",
                200
            )
            
            # Test update customer
            update_data = {
                "name": "John Doe Updated",
                "nickname": "Johnny Updated",
                "gstin": "27ABCDE5678G1Z5",
                "phone_1": "9876543211",
                "email_1": "john.updated@example.com",
                "address_1": "456 Customer Lane Updated, Mumbai"
            }
            
            success, response = self.run_test(
                "Update Customer",
                "PUT",
                f"customers/{self.customer_id}",
                200,
                data=update_data
            )
        
        return success

    def test_product_operations(self):
        """Test product CRUD operations"""
        print("\n=== PRODUCT OPERATIONS ===")
        
        # Test create product
        product_data = {
            "name": "Sports T-Shirt",
            "description": "Cotton sports t-shirt",
            "hsn": "6109",
            "default_rate": 500.00,
            "uom": "pcs"
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data
        )
        
        if success and 'id' in response:
            self.product_id = response['id']
            print(f"Product ID: {self.product_id}")
        
        # Test get all products
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        # Test search products
        success, response = self.run_test(
            "Search Products",
            "GET",
            "products",
            200,
            params={"search": "T-Shirt"}
        )
        
        return success

    def test_invoice_operations(self):
        """Test invoice CRUD operations with GST calculations"""
        print("\n=== INVOICE OPERATIONS ===")
        
        if not self.customer_id:
            print("❌ Cannot test invoices - no customer ID available")
            return False
        
        # Test create invoice with CGST+SGST (intra-state)
        invoice_data = {
            "customer_id": self.customer_id,
            "customer_name": "John Doe Updated",
            "customer_gstin": "27ABCDE5678G1Z5",
            "customer_address": "456 Customer Lane Updated, Mumbai",
            "customer_phone": "9876543211",
            "items": [
                {
                    "product_name": "Sports T-Shirt",
                    "description": "Cotton sports t-shirt",
                    "hsn": "6109",
                    "qty": 2,
                    "uom": "pcs",
                    "rate": 500.00,
                    "total": 1000.00,
                    "discount_amount": 50.00,
                    "cgst_percent": 9.0,
                    "sgst_percent": 9.0,
                    "igst_percent": 0.0,
                    "cgst_amount": 85.50,  # (1000-50) * 9%
                    "sgst_amount": 85.50,  # (1000-50) * 9%
                    "igst_amount": 0.0,
                    "taxable_amount": 950.00,
                    "final_amount": 1121.00  # 950 + 85.50 + 85.50
                }
            ],
            "subtotal": 1000.00,
            "total_discount": 50.00,
            "total_cgst": 85.50,
            "total_sgst": 85.50,
            "total_igst": 0.0,
            "total_tax": 171.00,
            "grand_total": 1121.00,
            "payment_method": "cash",
            "payment_status": "unpaid",
            "notes": "Test invoice with CGST+SGST"
        }
        
        success, response = self.run_test(
            "Create Invoice (CGST+SGST)",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if success and 'id' in response:
            self.invoice_id = response['id']
            print(f"Invoice ID: {self.invoice_id}")
            print(f"Invoice Number: {response.get('invoice_number', 'N/A')}")
        
        # Test create invoice with IGST (inter-state)
        invoice_data_igst = {
            "customer_id": self.customer_id,
            "customer_name": "John Doe Updated",
            "customer_gstin": "29ABCDE5678G1Z5",  # Different state code
            "customer_address": "456 Customer Lane, Karnataka",
            "customer_phone": "9876543211",
            "items": [
                {
                    "product_name": "Sports Shorts",
                    "description": "Cotton sports shorts",
                    "hsn": "6103",
                    "qty": 1,
                    "uom": "pcs",
                    "rate": 300.00,
                    "total": 300.00,
                    "discount_amount": 0.0,
                    "cgst_percent": 0.0,
                    "sgst_percent": 0.0,
                    "igst_percent": 18.0,
                    "cgst_amount": 0.0,
                    "sgst_amount": 0.0,
                    "igst_amount": 54.00,  # 300 * 18%
                    "taxable_amount": 300.00,
                    "final_amount": 354.00  # 300 + 54
                }
            ],
            "subtotal": 300.00,
            "total_discount": 0.0,
            "total_cgst": 0.0,
            "total_sgst": 0.0,
            "total_igst": 54.00,
            "total_tax": 54.00,
            "grand_total": 354.00,
            "payment_method": "upi",
            "payment_status": "paid",
            "notes": "Test invoice with IGST"
        }
        
        success, response = self.run_test(
            "Create Invoice (IGST)",
            "POST",
            "invoices",
            200,
            data=invoice_data_igst
        )
        
        # Test get all invoices
        success, response = self.run_test(
            "Get All Invoices",
            "GET",
            "invoices",
            200
        )
        
        # Test search invoices
        success, response = self.run_test(
            "Search Invoices",
            "GET",
            "invoices",
            200,
            params={"search": "INV"}
        )
        
        # Test get specific invoice
        if self.invoice_id:
            success, response = self.run_test(
                "Get Invoice by ID",
                "GET",
                f"invoices/{self.invoice_id}",
                200
            )
            
            # Test update payment status
            success, response = self.run_test(
                "Update Payment Status",
                "PUT",
                f"invoices/{self.invoice_id}/payment",
                200,
                params={"payment_status": "paid", "payment_method": "card"}
            )
        
        return success

    def test_master_data(self):
        """Test master data endpoints"""
        print("\n=== MASTER DATA ===")
        
        # Test GST rates
        success, response = self.run_test(
            "Get GST Rates",
            "GET",
            "gst-rates",
            200
        )
        
        if success:
            print(f"GST Rates: {response}")
        
        # Test HSN codes
        success, response = self.run_test(
            "Get HSN Codes",
            "GET",
            "hsn-codes",
            200
        )
        
        if success:
            print(f"HSN Codes count: {len(response)}")
        
        # Test HSN codes search
        success, response = self.run_test(
            "Search HSN Codes",
            "GET",
            "hsn-codes",
            200,
            params={"search": "shirt"}
        )
        
        return success

def main():
    print("🚀 Starting Billing App API Tests")
    print("=" * 50)
    
    tester = BillingAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_business_operations,
        tester.test_customer_operations,
        tester.test_product_operations,
        tester.test_invoice_operations,
        tester.test_master_data
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())