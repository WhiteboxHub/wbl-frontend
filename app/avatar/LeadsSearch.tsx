"use client";
import { AvatarLayout } from "@/components/AvatarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin_ui/card";
import { Button } from "@/components/admin_ui/button";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Badge } from "@/components/admin_ui/badge";
import { SearchIcon, FilterIcon } from "lucide-react";
import { useState } from "react";

export default function LeadsSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearched, setIsSearched] = useState(false);

  // Actual data from the Leads table
  const leadsData = [
    {
      id: 1,
      fullName: "John Smith",
      email: "john.smith@example.com",
      contact: "+1 (555) 123-4567",
      visaStatus: "H1B",
      education: "Master's in Computer Science",
      status: "active",
      enrolledDate: "2024-01-15",
      amountPaid: 5000,
      address: "123 Main St, Apt 4B, New York, NY 10001",
      referredBy: "Jane Doe",
      pincode: "10001",
      primaryEmergencyContact: "+1 (555) 987-6543",
      secondaryEmergencyContact: "+1 (555) 456-7890",
    },
    {
      id: 2,
      fullName: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      contact: "+1 (555) 234-5678",
      visaStatus: "Green Card",
      education: "Bachelor's in Information Technology",
      status: "active",
      enrolledDate: "2024-01-14",
      amountPaid: 7500,
      address: "456 Oak Ave, San Francisco, CA 94102",
      referredBy: "Mike Wilson",
      pincode: "94102",
      primaryEmergencyContact: "+1 (555) 876-5432",
      secondaryEmergencyContact: "+1 (555) 654-3210",
    },
    {
      id: 3,
      fullName: "Mike Wilson",
      email: "mike.wilson@example.com",
      contact: "+1 (555) 345-6789",
      visaStatus: "F1 Student",
      education: "PhD in Computer Engineering",
      status: "inactive",
      enrolledDate: "2024-01-10",
      amountPaid: 3000,
      address: "789 Pine St, Austin, TX 73301",
      referredBy: "Robert Brown",
      pincode: "73301",
      primaryEmergencyContact: "+1 (555) 765-4321",
      secondaryEmergencyContact: "+1 (555) 321-6547",
    },
    {
      id: 4,
      fullName: "Emily Davis",
      email: "emily.davis@example.com",
      contact: "+1 (555) 456-7890",
      visaStatus: "L1",
      education: "Master's in Business Administration",
      status: "active",
      enrolledDate: "2024-01-16",
      amountPaid: 8000,
      address: "321 Elm St, Seattle, WA 98101",
      referredBy: "Lisa Chen",
      pincode: "98101",
      primaryEmergencyContact: "+1 (555) 654-3210",
      secondaryEmergencyContact: "+1 (555) 987-1234",
    },
    {
      id: 5,
      fullName: "Robert Brown",
      email: "robert.brown@example.com",
      contact: "+1 (555) 567-8901",
      visaStatus: "OPT",
      education: "Bachelor's in Electrical Engineering",
      status: "active",
      enrolledDate: "2024-01-12",
      amountPaid: 4500,
      address: "654 Maple Dr, Boston, MA 02101",
      referredBy: "Emily Davis",
      pincode: "02101",
      primaryEmergencyContact: "+1 (555) 543-2109",
      secondaryEmergencyContact: "+1 (555) 210-9876",
    },
    {
      id: 6,
      fullName: "Lisa Chen",
      email: "lisa.chen@example.com",
      contact: "+1 (555) 678-9012",
      visaStatus: "H4 EAD",
      education: "Master's in Data Science",
      status: "inactive",
      enrolledDate: "2024-01-11",
      amountPaid: 6000,
      address: "987 Cedar Ave, Miami, FL 33101",
      referredBy: "John Smith",
      pincode: "33101",
      primaryEmergencyContact: "+1 (555) 432-1098",
      secondaryEmergencyContact: "+1 (555) 109-8765",
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Search across all columns
    const filteredResults = leadsData.filter((lead) => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        lead.id.toString().includes(searchTerm) ||
        lead.fullName.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        lead.contact.includes(searchQuery) ||
        lead.visaStatus.toLowerCase().includes(searchTerm) ||
        lead.education.toLowerCase().includes(searchTerm) ||
        lead.status.toLowerCase().includes(searchTerm) ||
        lead.enrolledDate.includes(searchQuery) ||
        lead.amountPaid.toString().includes(searchQuery) ||
        lead.address.toLowerCase().includes(searchTerm) ||
        lead.referredBy.toLowerCase().includes(searchTerm) ||
        lead.pincode.includes(searchQuery) ||
        lead.primaryEmergencyContact.includes(searchQuery) ||
        lead.secondaryEmergencyContact.includes(searchQuery)
      );
    });

    setSearchResults(filteredResults);
    setIsSearched(true);
  };

  const getStatusColor = (status: string) => {
    return status.toLowerCase() === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getVisaColor = (visa: string) => {
    switch (visa) {
      case "H1B":
        return "bg-blue-100 text-blue-800";
      case "Green Card":
        return "bg-emerald-100 text-emerald-800";
      case "F1 Student":
        return "bg-purple-100 text-purple-800";
      case "L1":
        return "bg-orange-100 text-orange-800";
      case "OPT":
        return "bg-indigo-100 text-indigo-800";
      case "H4 EAD":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AvatarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Leads</h1>
          <p className="text-gray-600">
            Search through leads by any field: Full Name, Email, Contact, Visa
            Status, Education, Address, etc.
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Full Name, Email, Contact, Visa Status, Education, Address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="bg-whitebox-600 hover:bg-whitebox-700"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline">
                <FilterIcon className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {isSearched && (
          <Card>
            <CardHeader>
              <CardTitle>
                Search Results ({searchResults.length} found)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No leads found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria or terms.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {searchResults.map((lead) => (
                    <Card
                      key={lead.id}
                      className="p-6 border-l-4 border-l-whitebox-500"
                    >
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              ID
                            </Label>
                            <p className="font-semibold">{lead.id}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Full Name
                            </Label>
                            <p className="text-lg font-semibold">
                              {lead.fullName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Email
                            </Label>
                            <p className="text-blue-600">{lead.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Contact
                            </Label>
                            <p>{lead.contact}</p>
                          </div>
                        </div>

                        {/* Status & Education */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Visa Status
                            </Label>
                            <div className="mt-1">
                              <Badge className={getVisaColor(lead.visaStatus)}>
                                {lead.visaStatus}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Status
                            </Label>
                            <div className="mt-1">
                              <Badge className={getStatusColor(lead.status)}>
                                {lead.status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Education
                            </Label>
                            <p>{lead.education}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Enrolled Date
                            </Label>
                            <p>{lead.enrolledDate}</p>
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Amount Paid
                            </Label>
                            <p className="text-green-600 font-semibold">
                              ${lead.amountPaid.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Address
                            </Label>
                            <p className="text-sm">{lead.address}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Pincode
                            </Label>
                            <p>{lead.pincode}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Referred By
                            </Label>
                            <p>{lead.referredBy}</p>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contacts */}
                      <div className="mt-6 pt-6 border-t grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            Primary Emergency Contact
                          </Label>
                          <p className="font-medium">
                            {lead.primaryEmergencyContact}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            Secondary Emergency Contact
                          </Label>
                          <p className="font-medium">
                            {lead.secondaryEmergencyContact}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AvatarLayout>
  );
}
