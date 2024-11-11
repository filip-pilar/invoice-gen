"use client";
import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  Download,
  Share,
  CalendarIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvoicePreview from "./invoice-preview";
import { InvoiceItemForm } from "./invoice-item-form";
import { InvoiceData, InvoiceItem, InvoiceTemplate } from "../types/invoice";
import { generatePDF } from "@/lib/generatePDF";
import {
  CurrencyCode,
  currencyOptions,
  generateInvoiceNumber,
} from "@/lib/helpers";
import { Alert, AlertDescription } from "./ui/alert";
import { invoiceTemplates } from "@/lib/template";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type InputChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement
>;

const emptyItem: InvoiceItem = {
  id: "",
  description: "",
  quantity: 0,
  price: 0,
  discount: 0,
  discountType: "percentage" as const,
  tax: 0,
};

export default function InvoiceGenerator() {
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    currency: "USD" as CurrencyCode,
    companyName: "",
    companyEmail: "",
    companyAddress: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    items: [],
    taxRate: 0,
    notes: "",
    logo: null,
    signature: null,
  });
  const [isPublishing, setIsPublishing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function signIn() {
      const { data, error } = await supabase.auth.signInAnonymously();
      console.log(data);
    }

    signIn();

    return () => {};
  }, []);

  const [currentItem, setCurrentItem] = useState<InvoiceItem>({
    ...emptyItem,
    id: crypto.randomUUID(),
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceNumber: generateInvoiceNumber(),
    }));
  }, []);

  const applyTemplate = (template: InvoiceTemplate | null) => {
    if (!template) {
      // Reset to initial state if "No Template" is selected
      setInvoiceData((prev) => ({
        ...prev,
        companyName: "",
        companyEmail: "",
        companyAddress: "",
        currency: "USD" as CurrencyCode,
        taxRate: 0,
        items: [],
        notes: "",
      }));
      return;
    }

    setInvoiceData((prev) => ({
      ...prev,
      ...template.data,
      // Preserve some fields that shouldn't be overwritten
      invoiceNumber: prev.invoiceNumber,
      date: prev.date,
      dueDate: prev.dueDate,
      clientName: prev.clientName,
      clientEmail: prev.clientEmail,
      clientAddress: prev.clientAddress,
      // Generate new IDs for items to ensure uniqueness
      items:
        template.data.items?.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        })) || [],
    }));
  };

  const handleInputChange = (e: InputChangeEvent) => {
    const { name, value } = e.target;
    setInvoiceData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (
    field: "date" | "dueDate",
    value: Date | undefined
  ) => {
    if (value) {
      setInvoiceData((prev) => ({
        ...prev,
        [field]: value.toISOString().split("T")[0],
      }));
    }
  };

  const handleItemChange = (updatedItem: InvoiceItem) => {
    setCurrentItem(updatedItem);
  };

  const handleAddItem = () => {
    if (
      !currentItem.description ||
      currentItem.quantity <= 0 ||
      currentItem.price <= 0
    ) {
      return;
    }

    // Validate discount and tax
    const validatedItem = {
      ...currentItem,
      discount: Math.min(
        currentItem.discount || 0,
        currentItem.discountType === "percentage"
          ? 100
          : currentItem.price * currentItem.quantity
      ),
      tax: Math.min(currentItem.tax || 0, 100),
    };

    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, validatedItem],
    }));

    // Reset current item
    setCurrentItem({ ...emptyItem, id: crypto.randomUUID() });
  };

  const handleRemoveItem = (id: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setInvoiceData((prev) => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      const signatureDataUrl = signatureRef.current.toDataURL();
      setInvoiceData((prev) => ({ ...prev, signature: signatureDataUrl }));
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setInvoiceData((prev) => ({ ...prev, signature: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsGenerating(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const blob = await generatePDF(invoiceData);
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setCurrentPage(2);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `invoice-${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePublish = async () => {
    if (!pdfUrl) {
      toast.error("No PDF generated");
      return;
    }

    setIsPublishing(true);

    try {
      // Calculate total amount
      const subtotal = invoiceData.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.price;
        const discountAmount =
          item.discountType === "percentage"
            ? (itemTotal * item.discount) / 100
            : item.discount;
        const afterDiscount = itemTotal - discountAmount;
        const withTax = afterDiscount * (1 + item.tax / 100);
        return sum + withTax;
      }, 0);

      const totalAmount = invoiceData.taxRate
        ? subtotal * (1 + invoiceData.taxRate / 100)
        : subtotal;

      // Upload PDF to Supabase storage
      const pdfBlob = await fetch(pdfUrl).then((r) => r.blob());
      const pdfFileName = `${invoiceData.invoiceNumber}/${Date.now()}.pdf`;

      const { data: pdfData, error: pdfError } = await supabase.storage
        .from("invoices")
        .upload(pdfFileName, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (pdfError) {
        throw new Error(`Error uploading PDF: ${pdfError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("invoices").getPublicUrl(pdfFileName);

      // Insert invoice data with default unpaid status
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceData.invoiceNumber,
          data: invoiceData,
          pdf_url: publicUrl,
          amount_total: parseFloat(totalAmount.toFixed(2)),
          due_date: invoiceData.dueDate || null,
          payment_status: "unpaid",
          amount_paid: 0,
        })
        .select()
        .single();

      if (invoiceError) {
        throw new Error(
          `Error inserting invoice data: ${invoiceError.message}`
        );
      }

      // Show success message
      toast.success("Invoice published successfully");

      // Redirect to the invoice page
      window.location.href = `/invoice/${invoice.id}`;
    } catch (error) {
      console.error("Error publishing invoice:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCurrencyChange = (value: CurrencyCode) => {
    setInvoiceData((prev) => ({
      ...prev,
      currency: value,
    }));
  };

  // Function to get preview data including current item
  const getPreviewData = (): InvoiceData => {
    const previewItems = [...invoiceData.items];

    // Only add current item to preview if it has at least a description
    if (currentItem.description) {
      previewItems.push(currentItem);
    }

    return {
      ...invoiceData,
      items: previewItems,
    };
  };

  return (
    <div className="h-screen flex flex-col">
      {currentPage === 1 ? (
        <div className="flex h-full gap-4 p-4">
          {/* Form Section */}
          <div className="w-[600px] flex flex-col">
            <div className="py-3">
              {/* <h2>Invoice Generator</h2> */}
              <div className="mb-4">
                <Label htmlFor="template">Invoice Template</Label>
                <Select
                  onValueChange={(value) => {
                    const template = invoiceTemplates.find(
                      (t) => t.id === value
                    );
                    applyTemplate(template || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Template</SelectItem>
                    {invoiceTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1">
              <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={invoiceData.invoiceNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !invoiceData.date && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceData.date ? (
                              format(new Date(invoiceData.date), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              invoiceData.date
                                ? new Date(invoiceData.date)
                                : undefined
                            }
                            onSelect={(date) => handleDateChange("date", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !invoiceData.dueDate && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceData.dueDate ? (
                              format(new Date(invoiceData.dueDate), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              invoiceData.dueDate
                                ? new Date(invoiceData.dueDate)
                                : undefined
                            }
                            onSelect={(date) =>
                              handleDateChange("dueDate", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={invoiceData.currency}
                        onValueChange={handleCurrencyChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {option.symbol}
                                </span>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={invoiceData.companyName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Company Email *</Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        value={invoiceData.companyEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyAddress">Company Address</Label>
                      <Textarea
                        id="companyAddress"
                        name="companyAddress"
                        value={invoiceData.companyAddress}
                        onChange={handleInputChange}
                        className="h-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        name="clientName"
                        value={invoiceData.clientName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Client Email *</Label>
                      <Input
                        id="clientEmail"
                        name="clientEmail"
                        type="email"
                        value={invoiceData.clientEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientAddress">Client Address</Label>
                      <Textarea
                        id="clientAddress"
                        name="clientAddress"
                        value={invoiceData.clientAddress}
                        onChange={handleInputChange}
                        className="h-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Items *</Label>
                    <InvoiceItemForm
                      currentItem={currentItem}
                      items={invoiceData.items}
                      onItemChange={handleItemChange}
                      onAddItem={handleAddItem}
                      onRemoveItem={handleRemoveItem}
                      currency={invoiceData.currency}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={invoiceData.notes}
                      onChange={handleInputChange}
                      className="h-20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo">Logo</Label>
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="signature">Signature</Label>
                    <SignatureCanvas
                      ref={signatureRef}
                      onEnd={handleSignatureEnd}
                      canvasProps={{
                        width: 500,
                        height: 150,
                        className: "border border-gray-300 rounded-md bg-white",
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearSignature}
                      size="sm"
                      className="mt-2"
                    >
                      Clear Signature
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : "Generate PDF"}
                  </Button>
                </form>
              </ScrollArea>
            </div>
          </div>

          {/* Preview Section */}
          <div className="flex-1 flex flex-col">
            <div className="py-3">{/* <h2>Live Preview</h2> */}</div>
            <div className="flex-1 p-4">
              <div className="h-[calc(100vh-120px)] overflow-auto">
                <div className="transform scale-75 origin-top">
                  <InvoicePreview data={getPreviewData()} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full p-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Generated Invoice</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share className="h-4 w-4 mr-2" />
                  )}
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <iframe
                src={pdfUrl || ""}
                className="w-full h-full border rounded-lg"
                title="Invoice PDF Preview"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
