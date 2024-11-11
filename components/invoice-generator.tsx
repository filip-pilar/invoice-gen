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
  Plus,
  Trash2,
  CalendarIcon,
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
import { InvoiceData, InvoiceItem } from "../types/invoice";
import { generatePDF } from "@/lib/generatePDF";
import {
  CurrencyCode,
  currencyOptions,
  generateInvoiceNumber,
} from "@/lib/helpers";

type InputChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement
>;

export default function InvoiceGenerator() {
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    currency: "USD" as CurrencyCode,
    companyName: "",
    companyAddress: "",
    clientName: "",
    clientAddress: "",
    items: [
      {
        id: "",
        description: "",
        quantity: 0,
        price: 0,
        discount: 0,
        discountType: "percentage" as const,
        tax: 0,
      },
    ],
    taxRate: 0,
    notes: "",
    logo: null,
    signature: null,
  });

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    setInvoiceData((prev) => ({
      ...prev,
      invoiceNumber: generateInvoiceNumber(),
      items: prev.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      })),
    }));
  }, []);

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

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...invoiceData.items];
    const item = { ...newItems[index] };

    if (
      field === "quantity" ||
      field === "price" ||
      field === "discount" ||
      field === "tax"
    ) {
      item[field] = Number(value);
    } else if (field === "discountType") {
      item[field] = value as "percentage" | "fixed";
    } else {
      item[field] = value as string;
    }

    newItems[index] = item;
    setInvoiceData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          description: "",
          quantity: 0,
          price: 0,
          discount: 0,
          discountType: "percentage",
          tax: 0,
        },
      ],
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

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setInvoiceData((prev) => ({ ...prev, signature: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const signatureDataUrl = signatureRef.current?.isEmpty()
      ? null
      : signatureRef.current?.toDataURL();
    const dataToSubmit: InvoiceData = {
      ...invoiceData,
      signature: signatureDataUrl || null,
    };

    try {
      const response = await generatePDF(dataToSubmit);
      const blob = await response.blob();
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

  const handlePublish = () => {
    console.log("Publishing invoice...");
  };

  const removeItem = (index: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCurrencyChange = (value: CurrencyCode) => {
    setInvoiceData((prev) => ({
      ...prev,
      currency: value,
    }));
  };

  return (
    <div className="h-screen flex flex-col">
      {currentPage === 1 ? (
        <div className="flex h-full gap-4 p-4">
          {/* Form Section */}
          <Card className="w-[600px] flex flex-col">
            <CardHeader className="py-3">
              <CardTitle>Invoice Generator</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
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
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        value={invoiceData.taxRate}
                        onChange={(e) =>
                          setInvoiceData((prev) => ({
                            ...prev,
                            taxRate: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={invoiceData.companyName}
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
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        name="clientName"
                        value={invoiceData.clientName}
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
                    <div className="flex justify-between items-center">
                      <Label>Items</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={addItem}
                        className="h-8"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {invoiceData.items.map((item, index) => (
                        <InvoiceItemForm
                          key={item.id}
                          item={item}
                          onChange={(updatedItem) => {
                            const newItems = [...invoiceData.items];
                            newItems[index] = updatedItem;
                            setInvoiceData((prev) => ({
                              ...prev,
                              items: newItems,
                            }));
                          }}
                          onRemove={() => removeItem(index)}
                        />
                      ))}
                    </div>
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
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="py-3">
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <div className="h-[calc(100vh-120px)] overflow-auto">
                <div className="transform scale-75 origin-top">
                  <InvoicePreview data={invoiceData} />
                </div>
              </div>
            </CardContent>
          </Card>
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
                <Button onClick={handlePublish}>
                  <Share className="h-4 w-4 mr-2" />
                  Publish
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
