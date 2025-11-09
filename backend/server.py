from fastapi import FastAPI, APIRouter, HTTPException
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
    pan: Optional[str] = None
    others: Optional[str] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email_1: Optional[EmailStr] = None
    email_2: Optional[EmailStr] = None
    address_1: Optional[str] = None
    address_2: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessCreate(BaseModel):
    legal_name: str
    nickname: Optional[str] = None
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state: Optional[str] = None
    pan: Optional[str] = None
    others: Optional[str] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email_1: Optional[EmailStr] = None
    email_2: Optional[EmailStr] = None
    address_1: Optional[str] = None
    address_2: Optional[str] = None


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
    city: Optional[str] = None
    state: Optional[str] = None
    address_1: Optional[str] = None
    address_2: Optional[str] = None
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
    city: Optional[str] = None
    state: Optional[str] = None
    address_1: Optional[str] = None
    address_2: Optional[str] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    hsn: Optional[str] = None
    default_rate: Optional[float] = None
    uom: str = "pcs"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    hsn: Optional[str] = None
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
    payment_method: Optional[str] = None
    payment_status: str = "unpaid"
    notes: Optional[str] = None
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
    payment_method: Optional[str] = None
    payment_status: str = "unpaid"
    notes: Optional[str] = None


# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Billing App API"}


# Business Routes
@api_router.post("/business", response_model=Business)
async def create_or_update_business(input: BusinessCreate):
    # Check if business already exists
    existing = await db.businesses.find_one({}, {"_id": 0})
    
    if existing:
        # Update existing business
        business_dict = input.model_dump()
        business_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        business_dict['id'] = existing['id']
        business_dict['created_at'] = existing['created_at']
        
        await db.businesses.update_one({"id": existing['id']}, {"$set": business_dict})
        
        if isinstance(business_dict['created_at'], str):
            business_dict['created_at'] = datetime.fromisoformat(business_dict['created_at'])
        if isinstance(business_dict['updated_at'], str):
            business_dict['updated_at'] = datetime.fromisoformat(business_dict['updated_at'])
            
        return Business(**business_dict)
    else:
        # Create new business
        business_obj = Business(**input.model_dump())
        doc = business_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.businesses.insert_one(doc)
        return business_obj

@api_router.get("/business", response_model=Optional[Business])
async def get_business():
    business = await db.businesses.find_one({}, {"_id": 0})
    if not business:
        return None
    
    if isinstance(business['created_at'], str):
        business['created_at'] = datetime.fromisoformat(business['created_at'])
    if isinstance(business['updated_at'], str):
        business['updated_at'] = datetime.fromisoformat(business['updated_at'])
    
    return Business(**business)


# Customer Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(input: CustomerCreate):
    customer_obj = Customer(**input.model_dump())
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
                {"city": {"$regex": search, "$options": "i"}},
                {"state": {"$regex": search, "$options": "i"}},
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
    
    customer_dict = input.model_dump()
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
    # Check if product exists
    existing = await db.products.find_one({"name": input.name}, {"_id": 0})
    if existing:
        # Update existing
        product_dict = input.model_dump()
        product_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
        product_dict['id'] = existing['id']
        product_dict['created_at'] = existing['created_at']
        
        await db.products.update_one({"name": input.name}, {"$set": product_dict})
        
        if isinstance(product_dict['created_at'], str):
            product_dict['created_at'] = datetime.fromisoformat(product_dict['created_at'])
        if isinstance(product_dict['updated_at'], str):
            product_dict['updated_at'] = datetime.fromisoformat(product_dict['updated_at'])
        
        return Product(**product_dict)
    
    product_obj = Product(**input.model_dump())
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(search: Optional[str] = None):
    query = {}
    if search:
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"hsn": {"$regex": search, "$options": "i"}},
            ]
        }
    
    products = await db.products.find(query, {"_id": 0}).sort("name", 1).to_list(1000)
    
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        if isinstance(product['updated_at'], str):
            product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return products


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
async def get_invoices(skip: int = 0, limit: int = 50, search: Optional[str] = None):
    query = {}
    if search:
        query = {
            "$or": [
                {"invoice_number": {"$regex": search, "$options": "i"}},
                {"customer_name": {"$regex": search, "$options": "i"}},
            ]
        }
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for invoice in invoices:
        if isinstance(invoice['invoice_date'], str):
            invoice['invoice_date'] = datetime.fromisoformat(invoice['invoice_date'])
        if isinstance(invoice['created_at'], str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
        if isinstance(invoice['updated_at'], str):
            invoice['updated_at'] = datetime.fromisoformat(invoice['updated_at'])
    
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
