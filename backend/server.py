from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============ MODELS ============

class Business(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    legal_name: str
    nickname: Optional[str] = None
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    pan: Optional[str] = None
    others: Optional[str] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email_1: Optional[EmailStr] = None
    email_2: Optional[EmailStr] = None
    website: Optional[str] = None
    address_1: Optional[str] = None
    address_2: Optional[str] = None
    logo: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessCreate(BaseModel):
    legal_name: str
    nickname: Optional[str] = None
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    pan: Optional[str] = None
    others: Optional[str] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email_1: Optional[EmailStr] = None
    email_2: Optional[EmailStr] = None
    website: Optional[str] = None
    address_1: Optional[str] = None
    address_2: Optional[str] = None
    logo: Optional[str] = None


class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    nickname: Optional[str] = None
    gstin: Optional[str] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email_1: Optional[EmailStr] = None
    email_2: Optional[EmailStr] = None
    address_1: Optional[str] = None
    city_1: Optional[str] = None
    state_1: Optional[str] = None
    pincode_1: Optional[str] = None
    address_2: Optional[str] = None
    city_2: Optional[str] = None
    state_2: Optional[str] = None
    pincode_2: Optional[str] = None
    has_business_with_gst: bool = False
    business_id: Optional[str] = None
    business_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    nickname: Optional[str] = None
    gstin: Optional[str] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email_1: Optional[EmailStr] = None
    email_2: Optional[EmailStr] = None
    address_1: Optional[str] = None
    city_1: Optional[str] = None
    state_1: Optional[str] = None
    pincode_1: Optional[str] = None
    address_2: Optional[str] = None
    city_2: Optional[str] = None
    state_2: Optional[str] = None
    pincode_2: Optional[str] = None
    has_business_with_gst: bool = False
    business_data: Optional[dict] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    hsn: Optional[str] = None
    gst_rate: Optional[float] = None
    default_rate: Optional[float] = None
    uom: str = "pcs"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    hsn: Optional[str] = None
    gst_rate: Optional[float] = None
    default_rate: Optional[float] = None
    uom: str = "pcs"


class InvoiceItem(BaseModel):
    product_name: str
    description: Optional[str] = None
    hsn: Optional[str] = None
    qty: float
    uom: str = "pcs"
    rate: float
    total: float
    discount_amount: float = 0
    cgst_percent: float = 0
    sgst_percent: float = 0
    igst_percent: float = 0
    cgst_amount: float = 0
    sgst_amount: float = 0
    igst_amount: float = 0
    taxable_amount: float
    final_amount: float

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    invoice_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    customer_id: str
    customer_name: str
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float
    total_discount: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    total_tax: float
    grand_total: float
    payment_status: str = "unpaid"
    payment_method: Optional[str] = None
    paid_amount: Optional[float] = 0
    balance_due: Optional[float] = 0
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvoiceCreate(BaseModel):
    customer_id: str
    customer_name: str
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float
    total_discount: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    total_tax: float
    grand_total: float
    payment_status: str = "unpaid"
    payment_method: Optional[str] = None
    paid_amount: Optional[float] = 0
    balance_due: Optional[float] = 0
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    invoice_date: Optional[str] = None


# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Billing App API"}


# Business Routes
@api_router.post("/businesses", response_model=Business)
async def create_business(input: BusinessCreate):
    business_obj = Business(**input.model_dump())
    doc = business_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.businesses.insert_one(doc)
    return business_obj

@api_router.get("/businesses")
async def get_businesses(search: Optional[str] = None, sort_by: Optional[str] = "created_at", sort_order: Optional[str] = "desc"):
    query = {}
    if search:
        query = {
            "$or": [
                {"legal_name": {"$regex": search, "$options": "i"}},
                {"nickname": {"$regex": search, "$options": "i"}},
                {"city": {"$regex": search, "$options": "i"}},
                {"state": {"$regex": search, "$options": "i"}},
                {"gstin": {"$regex": search, "$options": "i"}},
            ]
        }
    
    sort_direction = -1 if sort_order == "desc" else 1
    businesses = await db.businesses.find(query, {"_id": 0}).sort(sort_by, sort_direction).to_list(1000)
    
    # Add linked customers count to each business
    for business in businesses:
        if isinstance(business['created_at'], str):
            business['created_at'] = datetime.fromisoformat(business['created_at'])
        if isinstance(business['updated_at'], str):
            business['updated_at'] = datetime.fromisoformat(business['updated_at'])
        
        # Get linked customers
        linked_customers = await db.customers.find(
            {"business_id": business['id']}, 
            {"_id": 0, "name": 1}
        ).to_list(1000)
        business['linked_customers'] = [c['name'] for c in linked_customers]
        business['linked_customers_count'] = len(linked_customers)
    
    return businesses

@api_router.get("/businesses/{business_id}", response_model=Business)
async def get_business(business_id: str):
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    if isinstance(business['created_at'], str):
        business['created_at'] = datetime.fromisoformat(business['created_at'])
    if isinstance(business['updated_at'], str):
        business['updated_at'] = datetime.fromisoformat(business['updated_at'])
    
    return Business(**business)

@api_router.put("/businesses/{business_id}", response_model=Business)
async def update_business(business_id: str, input: BusinessCreate):
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    business_dict = input.model_dump()
    business_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    business_dict['id'] = business['id']
    business_dict['created_at'] = business['created_at']
    
    await db.businesses.update_one({"id": business_id}, {"$set": business_dict})
    
    if isinstance(business_dict['created_at'], str):
        business_dict['created_at'] = datetime.fromisoformat(business_dict['created_at'])
    if isinstance(business_dict['updated_at'], str):
        business_dict['updated_at'] = datetime.fromisoformat(business_dict['updated_at'])
    
    return Business(**business_dict)

@api_router.delete("/businesses/{business_id}")
async def delete_business(business_id: str):
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    await db.businesses.delete_one({"id": business_id})
    return {"message": "Business deleted successfully"}

# Admin Business Settings Routes (for Settings page and invoice calculations)
@api_router.get("/business", response_model=Optional[Business])
async def get_admin_business():
    """Get admin business settings (first business in collection)"""
    business = await db.businesses.find_one({}, {"_id": 0})
    if not business:
        return None
    
    if isinstance(business['created_at'], str):
        business['created_at'] = datetime.fromisoformat(business['created_at'])
    if isinstance(business['updated_at'], str):
        business['updated_at'] = datetime.fromisoformat(business['updated_at'])
    
    return Business(**business)

@api_router.post("/business", response_model=Business)
async def save_admin_business(input: BusinessCreate):
    """Save or update admin business settings"""
    # Check if admin business already exists
    existing_business = await db.businesses.find_one({}, {"_id": 0})
    
    if existing_business:
        # Update existing admin business
        business_dict = input.model_dump()
        business_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        business_dict['id'] = existing_business['id']
        business_dict['created_at'] = existing_business['created_at']
        
        await db.businesses.update_one({"id": existing_business['id']}, {"$set": business_dict})
        
        if isinstance(business_dict['created_at'], str):
            business_dict['created_at'] = datetime.fromisoformat(business_dict['created_at'])
        if isinstance(business_dict['updated_at'], str):
            business_dict['updated_at'] = datetime.fromisoformat(business_dict['updated_at'])
        
        return Business(**business_dict)
    else:
        # Create new admin business
        business_obj = Business(**input.model_dump())
        doc = business_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.businesses.insert_one(doc)
        return business_obj

@api_router.post("/business/upload-logo")
async def upload_business_logo(file: UploadFile = File(...)):
    """Upload business logo and store as base64"""
    try:
        # Read file content
        contents = await file.read()
        
        # Convert to base64
        base64_encoded = base64.b64encode(contents).decode('utf-8')
        logo_data = f"data:{file.content_type};base64,{base64_encoded}"
        
        # Update admin business with logo
        existing_business = await db.businesses.find_one({}, {"_id": 0})
        
        if existing_business:
            await db.businesses.update_one(
                {"id": existing_business['id']}, 
                {"$set": {"logo": logo_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            return {"message": "Logo uploaded successfully", "logo": logo_data}
        else:
            raise HTTPException(status_code=404, detail="Business not found. Please save business details first.")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")


# Customer Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(input: CustomerCreate):
    customer_data = input.model_dump(exclude={'business_data'})
    
    # Handle business logic
    if input.has_business_with_gst:
        if input.business_data and input.business_data.get('legal_name'):
            business_data = input.business_data
            
            # Check if business with same GSTIN already exists
            existing_business = None
            if business_data.get('gstin'):
                existing_business = await db.businesses.find_one(
                    {"gstin": business_data['gstin']}, 
                    {"_id": 0}
                )
            
            if existing_business:
                # Link to existing business
                customer_data['business_id'] = existing_business['id']
                customer_data['business_name'] = existing_business['legal_name']
            else:
                # Create new business
                business_obj = Business(
                    legal_name=business_data.get('legal_name'),
                    nickname=business_data.get('nickname'),
                    gstin=business_data.get('gstin'),
                    state_code=business_data.get('state_code'),
                    state=business_data.get('state'),
                    city=business_data.get('city'),
                    pan=business_data.get('pan'),
                    others=business_data.get('others'),
                    phone_1=business_data.get('phone_1'),
                    phone_2=business_data.get('phone_2'),
                    email_1=business_data.get('email_1'),
                    email_2=business_data.get('email_2'),
                    address_1=business_data.get('address_1'),
                    address_2=business_data.get('address_2'),
                )
                business_doc = business_obj.model_dump()
                business_doc['created_at'] = business_doc['created_at'].isoformat()
                business_doc['updated_at'] = business_doc['updated_at'].isoformat()
                await db.businesses.insert_one(business_doc)
                
                customer_data['business_id'] = business_obj.id
                customer_data['business_name'] = business_obj.legal_name
        else:
            customer_data['business_name'] = "NA"
    else:
        customer_data['business_name'] = "NA"
    
    customer_obj = Customer(**customer_data)
    doc = customer_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.customers.insert_one(doc)
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(search: Optional[str] = None, sort_by: Optional[str] = "created_at", sort_order: Optional[str] = "desc"):
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"nickname": {"$regex": search, "$options": "i"}},
                {"phone_1": {"$regex": search, "$options": "i"}},
                {"city_1": {"$regex": search, "$options": "i"}},
                {"state_1": {"$regex": search, "$options": "i"}},
                {"pincode_1": {"$regex": search, "$options": "i"}},
            ]
        }
    
    sort_direction = -1 if sort_order == "desc" else 1
    customers = await db.customers.find(query, {"_id": 0}).sort(sort_by, sort_direction).to_list(1000)
    
    for customer in customers:
        if isinstance(customer['created_at'], str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
        if isinstance(customer['updated_at'], str):
            customer['updated_at'] = datetime.fromisoformat(customer['updated_at'])
    
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if isinstance(customer['created_at'], str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    if isinstance(customer['updated_at'], str):
        customer['updated_at'] = datetime.fromisoformat(customer['updated_at'])
    
    return Customer(**customer)

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, input: CustomerCreate):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer_dict = input.model_dump(exclude={'business_data'})
    
    # Handle business logic
    if input.has_business_with_gst:
        if input.business_data and input.business_data.get('legal_name'):
            business_data = input.business_data
            
            # Check if business with same GSTIN already exists
            existing_business = None
            if business_data.get('gstin'):
                existing_business = await db.businesses.find_one(
                    {"gstin": business_data['gstin']}, 
                    {"_id": 0}
                )
            
            if existing_business:
                # Link to existing business
                customer_dict['business_id'] = existing_business['id']
                customer_dict['business_name'] = existing_business['legal_name']
            else:
                # Create new business
                business_obj = Business(
                    legal_name=business_data.get('legal_name'),
                    nickname=business_data.get('nickname'),
                    gstin=business_data.get('gstin'),
                    state_code=business_data.get('state_code'),
                    state=business_data.get('state'),
                    city=business_data.get('city'),
                    pan=business_data.get('pan'),
                    others=business_data.get('others'),
                    phone_1=business_data.get('phone_1'),
                    phone_2=business_data.get('phone_2'),
                    email_1=business_data.get('email_1'),
                    email_2=business_data.get('email_2'),
                    address_1=business_data.get('address_1'),
                    address_2=business_data.get('address_2'),
                )
                business_doc = business_obj.model_dump()
                business_doc['created_at'] = business_doc['created_at'].isoformat()
                business_doc['updated_at'] = business_doc['updated_at'].isoformat()
                await db.businesses.insert_one(business_doc)
                
                customer_dict['business_id'] = business_obj.id
                customer_dict['business_name'] = business_obj.legal_name
        else:
            customer_dict['business_name'] = "NA"
            customer_dict['business_id'] = None
    else:
        customer_dict['business_name'] = "NA"
        customer_dict['business_id'] = None
    
    customer_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    customer_dict['id'] = customer['id']
    customer_dict['created_at'] = customer['created_at']
    
    await db.customers.update_one({"id": customer_id}, {"$set": customer_dict})
    
    if isinstance(customer_dict['created_at'], str):
        customer_dict['created_at'] = datetime.fromisoformat(customer_dict['created_at'])
    if isinstance(customer_dict['updated_at'], str):
        customer_dict['updated_at'] = datetime.fromisoformat(customer_dict['updated_at'])
    
    return Customer(**customer_dict)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    await db.customers.delete_one({"id": customer_id})
    return {"message": "Customer deleted successfully"}


# Product Routes
@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    product_obj = Product(**input.model_dump())
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(search: Optional[str] = None, sort_by: Optional[str] = "created_at", sort_order: Optional[str] = "desc"):
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}},
                {"hsn": {"$regex": search, "$options": "i"}},
            ]
        }
    
    sort_direction = -1 if sort_order == "desc" else 1
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_direction).to_list(1000)
    
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product['updated_at'], str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if isinstance(product['updated_at'], str):
        product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductCreate):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_dict = input.model_dump()
    product_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    product_dict['id'] = product['id']
    product_dict['created_at'] = product['created_at']
    
    await db.products.update_one({"id": product_id}, {"$set": product_dict})
    
    if isinstance(product_dict['created_at'], str):
        product_dict['created_at'] = datetime.fromisoformat(product_dict['created_at'])
    if isinstance(product_dict['updated_at'], str):
        product_dict['updated_at'] = datetime.fromisoformat(product_dict['updated_at'])
    
    return Product(**product_dict)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted successfully"}


# Invoice Routes
@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(input: InvoiceCreate):
    # Generate invoice number
    count = await db.invoices.count_documents({})
    invoice_number = f"INV-{count + 1:05d}"
    
    invoice_obj = Invoice(**input.model_dump(), invoice_number=invoice_number)
    doc = invoice_obj.model_dump()
    doc['invoice_date'] = doc['invoice_date'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.invoices.insert_one(doc)
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def get_invoices(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    include_deleted: bool = False
):
    query = {"is_deleted": False} if not include_deleted else {"is_deleted": True}
    
    if search:
        query["$or"] = [
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
        ]
    
    # Date range filter
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        if date_query:
            query["invoice_date"] = date_query
    
    sort_direction = -1 if sort_order == "desc" else 1
    invoices = await db.invoices.find(query, {"_id": 0}).sort(sort_by, sort_direction).skip(skip).limit(limit).to_list(limit)
    
    for invoice in invoices:
        if isinstance(invoice.get('invoice_date'), str):
            invoice['invoice_date'] = datetime.fromisoformat(invoice['invoice_date'])
        if isinstance(invoice.get('created_at'), str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
        if isinstance(invoice.get('updated_at'), str):
            invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
        if invoice.get('deleted_at') and isinstance(invoice['deleted_at'], str):
            invoice['deleted_at'] = datetime.fromisoformat(invoice['deleted_at'])
    
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if isinstance(invoice['invoice_date'], str):
        invoice['invoice_date'] = datetime.fromisoformat(invoice['invoice_date'])
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    if isinstance(invoice['updated_at'], str):
        invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
    
    return Invoice(**invoice)

@api_router.put("/invoices/{invoice_id}/payment", response_model=Invoice)
async def update_payment_status(invoice_id: str, payment_status: str, payment_method: Optional[str] = None):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = {
        "payment_status": payment_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if payment_method:
        update_data["payment_method"] = payment_method
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    # Fetch updated invoice
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    
    if isinstance(invoice['invoice_date'], str):
        invoice['invoice_date'] = datetime.fromisoformat(invoice['invoice_date'])
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    if isinstance(invoice['updated_at'], str):
        invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
    
    return Invoice(**invoice)

@api_router.put("/invoices/{invoice_id}", response_model=Invoice)
async def update_invoice(invoice_id: str, input: InvoiceCreate):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice_dict = input.model_dump()
    invoice_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    invoice_dict['id'] = invoice['id']
    invoice_dict['invoice_number'] = invoice['invoice_number']
    invoice_dict['created_at'] = invoice['created_at']
    invoice_dict['is_deleted'] = invoice.get('is_deleted', False)
    invoice_dict['deleted_at'] = invoice.get('deleted_at')
    
    # Handle invoice_date - use provided or keep original
    provided_date = invoice_dict.get('invoice_date')
    if provided_date:
        if isinstance(provided_date, datetime):
            invoice_dict['invoice_date'] = provided_date.isoformat()
        # invoice_date is already a string, keep it as is
    else:
        # Preserve original invoice_date if not provided
        invoice_dict['invoice_date'] = invoice.get('invoice_date')
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": invoice_dict})
    
    # Fetch and return updated invoice
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if isinstance(invoice['invoice_date'], str):
        invoice['invoice_date'] = datetime.fromisoformat(invoice['invoice_date'])
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    if isinstance(invoice['updated_at'], str):
        invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
    
    return Invoice(**invoice)

@api_router.delete("/invoices/{invoice_id}")
async def soft_delete_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    await db.invoices.update_one(
        {"id": invoice_id}, 
        {"$set": {
            "is_deleted": True,
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Invoice moved to archives"}

@api_router.post("/invoices/{invoice_id}/restore")
async def restore_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    await db.invoices.update_one(
        {"id": invoice_id}, 
        {"$set": {
            "is_deleted": False,
            "deleted_at": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Invoice restored successfully"}


# Master Data Routes
@api_router.get("/gst-rates")
async def get_gst_rates():
    return [
        {"value": 0, "label": "0%"},
        {"value": 5, "label": "5%"},
        {"value": 12, "label": "12%"},
        {"value": 18, "label": "18%"},
        {"value": 28, "label": "28%"},
    ]

@api_router.get("/hsn-codes")
async def get_hsn_codes(search: Optional[str] = None):
    # Common HSN codes for sports clothing
    hsn_codes = [
        {"code": "6101", "description": "Men's or boys' overcoats, anoraks, windcheaters"},
        {"code": "6102", "description": "Women's or girls' overcoats, anoraks, windcheaters"},
        {"code": "6103", "description": "Men's or boys' suits, ensembles, jackets, trousers"},
        {"code": "6104", "description": "Women's or girls' suits, ensembles, jackets, dresses, skirts"},
        {"code": "6105", "description": "Men's or boys' shirts, knitted or crocheted"},
        {"code": "6106", "description": "Women's or girls' blouses, shirts, knitted or crocheted"},
        {"code": "6109", "description": "T-shirts, singlets and other vests, knitted or crocheted"},
        {"code": "6110", "description": "Jerseys, pullovers, cardigans, waistcoats"},
        {"code": "6111", "description": "Babies' garments and clothing accessories"},
        {"code": "6112", "description": "Track suits, ski suits and swimwear, knitted"},
        {"code": "6114", "description": "Other garments, knitted or crocheted"},
        {"code": "6115", "description": "Panty hose, tights, stockings, socks"},
        {"code": "6116", "description": "Gloves, mittens and mitts, knitted or crocheted"},
        {"code": "6117", "description": "Other made up clothing accessories"},
    ]
    
    if search:
        hsn_codes = [hsn for hsn in hsn_codes if search.lower() in hsn['code'].lower() or search.lower() in hsn['description'].lower()]
    
    return hsn_codes


# Dashboard Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Get dashboard statistics for a date range
    - Total sales (sum of grand_total for invoices in date range)
    - Pending dues (sum of balance_due for unpaid + partial invoices)
    - TOP 5 customers with highest dues
    """
    # Build query for date range
    query = {"is_deleted": False}
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        if date_query:
            query["invoice_date"] = date_query
    
    # Get invoices for the date range
    invoices = await db.invoices.find(query, {"_id": 0}).to_list(10000)
    
    # Calculate total sales (sum of grand_total)
    total_sales = sum(inv.get('grand_total', 0) for inv in invoices)
    
    # Calculate pending dues (unpaid + partial invoices)
    pending_dues_query = {
        "is_deleted": False,
        "payment_status": {"$in": ["unpaid", "partial"]}
    }
    
    pending_invoices = await db.invoices.find(pending_dues_query, {"_id": 0}).to_list(10000)
    
    total_pending_dues = 0
    invoice_dues = []
    
    for inv in pending_invoices:
        due_amount = 0
        if inv.get('payment_status') == 'unpaid':
            due_amount = inv.get('grand_total', 0)
        elif inv.get('payment_status') == 'partial':
            due_amount = inv.get('balance_due', 0)
        
        total_pending_dues += due_amount
        
        # Add individual invoice to the list
        invoice_dues.append({
            'invoice_id': inv.get('id'),
            'invoice_number': inv.get('invoice_number'),
            'customer_id': inv.get('customer_id'),
            'customer_name': inv.get('customer_name'),
            'invoice_date': inv.get('invoice_date'),
            'payment_status': inv.get('payment_status'),
            'grand_total': inv.get('grand_total', 0),
            'paid_amount': inv.get('paid_amount', 0),
            'due_amount': due_amount
        })
    
    # Get TOP 5 invoices by due amount
    top_5_dues = sorted(invoice_dues, key=lambda x: x['due_amount'], reverse=True)[:5]
    
    return {
        "total_sales": total_sales,
        "total_pending_dues": total_pending_dues,
        "top_5_dues": top_5_dues,
        "invoice_count": len(invoices)
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
