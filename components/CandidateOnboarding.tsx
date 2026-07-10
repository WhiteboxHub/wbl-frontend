"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Upload, FileText, CheckCircle, AlertTriangle, PenTool } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/admin_ui/select";
import { Textarea } from "@/components/admin_ui/textarea";
import { ScrollArea } from "@/components/admin_ui/scroll-area";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface CandidateOnboardingProps {
    candidateId: number;
    onComplete: () => void;
    onSkip?: () => void;
    loginCount?: number;
    currentAgreementStatus?: string;
    initialHasMissingFields?: boolean;
}

export default function CandidateOnboarding({
    candidateId,
    onComplete,
    onSkip,
    loginCount = 0,
    currentAgreementStatus,
    initialHasMissingFields = true
}: CandidateOnboardingProps) {
    const [step, setStep] = useState(initialHasMissingFields ? 1 : 2);
    const [loading, setLoading] = useState(false);
    const [isPendingApproval, setIsPendingApproval] = useState(currentAgreementStatus === 'P' && !initialHasMissingFields);

    // Step 1 State
    const [profile, setProfile] = useState<any>({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        zip_code: "",
        workstatus: "",
        linkedin_id: "",
        education: "",
        workexperience: "",
        secondaryemail: "",
        secondaryphone: "",
        github_link: "",
        dob: "",
        emergcontactname: "",
        emergcontactemail: "",
        emergcontactphone: "",
        emergcontactaddrs: "",

    });

    const [signature, setSignature] = useState("");
    const [agreed, setAgreed] = useState(false);

    // Step 2 State
    const [documents, setDocuments] = useState({
        govId: null as File | null,
        resume: null as File | null,
    });

    // Step 3 State

    useEffect(() => {
        loadProfile();
    }, [candidateId]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const data = await apiFetch(`candidates/${candidateId}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (data) {
                setProfile({
                    full_name: data.personal_info?.full_name || "",
                    email: data.personal_info?.email || "",
                    phone: data.personal_info?.phone || "",
                    address: data.personal_info?.address || "",
                    zip_code: data.personal_info?.zip_code || "",
                    workstatus: data.personal_info?.workstatus || "",
                    linkedin_id: data.personal_info?.linkedin_id || "",
                    education: data.personal_info?.education || "",
                    workexperience: data.personal_info?.workexperience || "",
                    secondaryemail: data.personal_info?.secondaryemail || "",
                    secondaryphone: data.personal_info?.secondaryphone || "",
                    github_link: data.personal_info?.github_link || "",
                    dob: data.personal_info?.dob ? data.personal_info.dob.split('T')[0] : "",
                    emergcontactname: data.emergency_contact?.name || "",
                    emergcontactemail: data.emergency_contact?.email || "",
                    emergcontactphone: data.emergency_contact?.phone || "",
                    emergcontactaddrs: data.emergency_contact?.address || "",
                    placement_percentage: data.placement_percentage || 13,
                    enrollment_status: data.enrollment?.enrollment_status || "not completed",
                });
                if ((data.enrollment?.enrollment_status === 'completed' || data.enrollment?.enrollment_status === 'Completed') && !initialHasMissingFields) {
                    setStep(3);
                }
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const getFilteredProfile = () => {
        const allowedFields = [
            'full_name', 'email', 'phone', 'workstatus', 'education', 'workexperience',
            'agreement', 'secondaryemail', 'secondaryphone', 'address', 'zip_code',
            'linkedin_id', 'dob', 'emergcontactname', 'emergcontactemail', 'emergcontactphone',
            'emergcontactaddrs', 'fee_paid', 'notes', 'candidate_folder', 'github_link'
        ];

        const filtered: any = {};
        allowedFields.forEach(field => {
            let value = profile[field as keyof typeof profile];
            if (value === "") value = null;
            // Fix: Strip time from date strings
            if (value && (field === 'dob' || field === 'enrolled_date') && typeof value === 'string' && value.includes('T')) {
                value = value.split('T')[0];
            }
            if (value !== undefined) {
                filtered[field] = value;
            }
        });

        console.log("ONBOARDING SUBMISSION PAYLOAD:", filtered);
        return filtered;
    };

    // Determine if we are in "add mode" (initial missing fields) or editing existing profile
    const isAddMode = initialHasMissingFields;

    const validateProfile = (profile: any): string => {
        // Base required fields for all modes
        const baseRequired = ['full_name', 'email', 'phone', 'workstatus', 'dob', 'github_link', 'education', 'address', 'linkedin_id', 'zip_code'];
        // Emergency contact fields are only required in add mode
        const emergencyRequired = isAddMode ? ['emergcontactname', 'emergcontactemail', 'emergcontactphone', 'emergcontactaddrs'] : [];
        const requiredFields = [...baseRequired, ...emergencyRequired];
        const missing = requiredFields.filter(f => !profile[f]);
        if (missing.length > 0) {
            return `Missing required fields: ${missing.join(', ')}`;
        }
        // URL validation
        if (profile.linkedin_id && !isValidURL(profile.linkedin_id)) {
            return "Please provide a valid LinkedIn profile URL.";
        }
        if (profile.github_link && !isValidURL(profile.github_link)) {
            return "Please provide a valid GitHub profile URL.";
        }
        if (profile.phone && !isValidPhone(profile.phone)) {
            return "Please provide a valid phone number (e.g. +1 555-123-4567).";
        }
        if (profile.secondaryphone && !isValidPhone(profile.secondaryphone)) {
            return "Please provide a valid secondary phone number (e.g. +1 555-123-4567).";
        }
        if (profile.emergcontactphone && !isValidPhone(profile.emergcontactphone)) {
            return "Please provide a valid emergency contact phone number (e.g. +1 555-123-4567).";
        }
        return '';
    };

    const handleSaveProfile = async () => {
        // Base required fields for saving
        const baseRequired = ['full_name', 'email', 'phone', 'workstatus', 'dob', 'github_link', 'education', 'address', 'linkedin_id', 'zip_code'];
        const emergencyRequired = isAddMode ? ['emergcontactname', 'emergcontactemail', 'emergcontactphone', 'emergcontactaddrs'] : [];
        const requiredFields = [...baseRequired, ...emergencyRequired];

        const missingFields = requiredFields.filter(field => !profile[field]);

        if (missingFields.length > 0) {
            toast.error("Please fill all required details to continue.");
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");

            const filteredProfile = getFilteredProfile();

            try {
                await apiFetch(`candidates/${candidateId}`, {
                    method: "PUT",
                    body: filteredProfile,
                });
            } catch (err: any) {
                const errorData = err.body || {};
                console.error("Validation Error:", errorData);
                const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || err.message);
                toast.error(`Error: ${detail}`);
                return;
            }

            toast.success("Profile details saved successfully");
            if (currentAgreementStatus === 'P') {
                setIsPendingApproval(true);
            } else {
                setStep(profile.enrollment_status === 'completed' ? 3 : 2);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof documents) => {
        if (e.target.files && e.target.files[0]) {
            setDocuments(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const handleUploadDocuments = async () => {
        if (!documents.govId) {
            toast.error("Please upload all required documents");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const formData = new FormData();

            // Append all files
            if (documents.govId) formData.append('govId', documents.govId);
            if (documents.resume) formData.append('resume', documents.resume);

            try {
                await apiFetch(`candidates/${candidateId}/onboarding/upload`, {
                    method: 'POST',
                    body: formData
                });
            } catch (err: any) {
                const error = err.body || {};
                throw new Error(error.detail || "Upload failed");
            }

            toast.success("Documents uploaded and sent for review!");
            setIsPendingApproval(true);
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to upload documents");
        } finally {
            setLoading(false);
        }
    };



    // Helper validation functions
    const isValidEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
    const isValidURL = (url: string) => {
        const trimmed = url.trim();
        if (!trimmed) return false;
        let testUrl = trimmed;
        if (!/^https?:\/\//i.test(trimmed)) {
            testUrl = `https://${trimmed}`;
        }
        try {
            const parsed = new URL(testUrl);
            // Require a hostname with at least one dot (e.g., example.com) to avoid "http" or similar dummy inputs
            const hasValidHost = parsed.hostname && parsed.hostname.includes('.');
            return (parsed.protocol === "http:" || parsed.protocol === "https:") && hasValidHost;
        } catch {
            return false;
        }
    };

    const isValidPhone = (phone: string) => {
        const trimmed = phone.trim();
        if (!trimmed) return false;
        const phoneRegex = /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
        return phoneRegex.test(trimmed);
    };

    const handleFinishOnboarding = async () => {
        if (!agreed || !signature.trim()) {
            toast.error("Please agree to the terms and provide your signature");
            return;
        }
        // Basic profile validation before submission
        const { email, linkedin_id, github_link, phone, secondaryphone, emergcontactphone } = getFilteredProfile();
        if (!isValidEmail(email)) {
            toast.error("Please enter a valid email address.");
            return;
        }
        if (!isValidURL(linkedin_id)) {
            toast.error("Please provide a valid LinkedIn profile URL.");
            return;
        }
        if (!isValidURL(github_link)) {
            toast.error("Please provide a valid GitHub profile URL.");
            return;
        }
        if (!isValidPhone(phone)) {
            toast.error("Please enter a valid phone number (e.g. +1 555-123-4567).");
            return;
        }
        if (secondaryphone && !isValidPhone(secondaryphone)) {
            toast.error("Please provide a valid secondary phone number (e.g. +1 555-123-4567).");
            return;
        }
        if (emergcontactphone && !isValidPhone(emergcontactphone)) {
            toast.error("Please provide a valid emergency contact phone number (e.g. +1 555-123-4567).");
            return;
        }


        setLoading(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const filteredProfile = getFilteredProfile();

            // Clean payload for final submission with basic info
            const finalPayload = {
                ...filteredProfile, // Include the already verified profile data
                enrollment_status: "completed",
                notes: `Agreement signed electronically at ${new Date().toLocaleString()}. Signature: ${signature}`
            };

            try {
                await apiFetch(`candidates/${candidateId}`, {
                    method: "PUT",
                    body: finalPayload,
                });
            } catch (err: any) {
                const errorData = err.body || {};
                console.error("Final Submission Error:", errorData);
                const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || err.message);
                toast.error(`Final Error: ${detail}`);
                return;
            }

            toast.success("Terms agreed and signed!");
            setStep(3);
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit application");
        } finally {
            setLoading(false);
        }
    };

    if (isPendingApproval) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-10 shadow-2xl border border-gray-100 dark:border-gray-800 text-center">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Submitted!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Thank you for completing your profile and uploading your documents. Your application is currently under review by our recruiting team.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome to Whitebox Learning</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Let's get your profile set up before you access your dashboard.</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-10">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10 -translate-y-1/2"></div>
                        <div className="absolute left-0 top-1/2 h-1 bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }}></div>

                        {[
                            { step: 1, label: "Complete Profile" },
                            { step: 2, label: "Agreement" },
                            { step: 3, label: "Upload Documents" }
                        ].map((s) => (
                            <div key={s.step} className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm ${step > s.step ? 'bg-blue-600 text-white' : step === s.step ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30' : 'bg-white text-gray-400 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'}`}>
                                    {step > s.step ? <Check className="w-5 h-5" /> : s.step}
                                </div>
                                <span className={`mt-2 text-xs font-bold ${step >= s.step ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    {step === 1 && (() => {
                        const requiredFields = [
                            { key: 'full_name', label: 'Full Name *' },
                            { key: 'email', label: 'Email *' },
                            { key: 'phone', label: 'Phone *' },
                            { key: 'workstatus', label: 'Work Status *' },
                            { key: 'dob', label: 'Date of Birth *' },
                            { key: 'github_link', label: 'Github Link *' },
                            { key: 'education', label: 'Education *' },
                            { key: 'address', label: 'Address *' },
                            { key: 'linkedin_id', label: 'LinkedIn ID *' },
                            { key: 'emergcontactname', label: 'Emergency Contact Name *' },
                            { key: 'emergcontactemail', label: 'Emergency Contact Email *' },
                            { key: 'emergcontactphone', label: 'Emergency Contact Phone *' },
                            { key: 'emergcontactaddrs', label: 'Emergency Contact Address *' }
                        ];
                        const missing = requiredFields.filter(f => !profile[f.key]);
                        const invalidFields = [];
                        if (profile.email && !isValidEmail(profile.email)) invalidFields.push('Email');
                        if (profile.secondaryemail && !isValidEmail(profile.secondaryemail)) invalidFields.push('Secondary Email');
                        if (profile.emergcontactemail && !isValidEmail(profile.emergcontactemail)) invalidFields.push('Emergency Contact Email');
                        if (profile.linkedin_id && !isValidURL(profile.linkedin_id)) invalidFields.push('LinkedIn ID');
                        if (profile.github_link && !isValidURL(profile.github_link)) invalidFields.push('Github Link');
                        if (profile.phone && !isValidPhone(profile.phone)) invalidFields.push('Phone');
                        if (profile.secondaryphone && !isValidPhone(profile.secondaryphone)) invalidFields.push('Secondary Phone');
                        if (profile.emergcontactphone && !isValidPhone(profile.emergcontactphone)) invalidFields.push('Emergency Contact Phone');


                        const hasErrors = missing.length > 0 || invalidFields.length > 0;

                        return (
                            <div className="p-8 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Action Required: Complete Your Profile</h2>

                                {hasErrors ? (
                                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-sm text-red-800 dark:text-red-200 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                                        <div>
                                            <p className="font-bold mb-1">Action Required: Missing or Invalid Information</p>
                                            <p className="mb-2">You must complete your profile with valid information before you can access the dashboard. Please check the following fields below:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {missing.map(f => (
                                                    <span key={f.key} className="bg-red-100 dark:bg-red-800/50 px-2 py-0.5 rounded text-xs font-semibold">
                                                        Missing: {f.label.replace(' *', '')}
                                                    </span>
                                                ))}
                                                {invalidFields.map(f => (
                                                    <span key={f} className="bg-red-100 dark:bg-red-800/50 px-2 py-0.5 rounded text-xs font-semibold">
                                                        Invalid: {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`${loginCount <= 1 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'} rounded-lg p-4 mb-6 text-sm flex items-start gap-3`}>
                                        {loginCount <= 1 ? (
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                                        ) : (
                                            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                                        )}
                                        <div>
                                            <p className="font-bold mb-1">{loginCount <= 1 ? "Action Required" : "Profile Complete"}</p>
                                            <p>{loginCount <= 1 ? "Please fill all required details to proceed." : "All required fields are filled and valid. You can now proceed to the next step."}</p>
                                        </div>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                                ) : (
                                    <ScrollArea className="h-[450px] pr-4 -mr-2">
                                        <div className="mt-4 space-y-8 pb-4">
                                            {/* Section 1: Basic Information */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800 mb-4 border-b border-blue-100 pb-2">
                                                    Basic Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Full Name <span className="text-red-700">*</span></Label>
                                                        <Input name="full_name" value={profile.full_name} onChange={handleProfileChange} placeholder="John Doe" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Email <span className="text-red-700">*</span></Label>
                                                        <Input name="email" type="email" value={profile.email} onChange={handleProfileChange} onBlur={() => { const err = isValidEmail(profile.email) ? null : "Please provide a valid email address."; if (err) toast.error(err); }} placeholder="john@example.com" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Phone <span className="text-red-700">*</span></Label>
                                                        <Input name="phone" value={profile.phone} onChange={handleProfileChange} onBlur={() => { const err = isValidPhone(profile.phone) ? null : "Please provide a valid phone number (e.g. +1 555-123-4567)."; if (err) toast.error(err); }} placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Date of Birth <span className="text-red-700">*</span></Label>
                                                        <Input name="dob" type="date" value={profile.dob} onChange={handleProfileChange} className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Work Status <span className="text-red-700">*</span></Label>
                                                        <Select value={profile.workstatus} onValueChange={(v) => setProfile({ ...profile, workstatus: v })}>
                                                            <SelectTrigger className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="US_CITIZEN">US Citizen</SelectItem>
                                                                <SelectItem value="GREEN_CARD">Green Card</SelectItem>
                                                                <SelectItem value="GC_EAD">GC EAD</SelectItem>
                                                                <SelectItem value="I485_EAD">I485 EAD</SelectItem>
                                                                <SelectItem value="I140_APPROVED">I140 Approved</SelectItem>
                                                                <SelectItem value="F1">F1</SelectItem>
                                                                <SelectItem value="F1_OPT">F1 OPT</SelectItem>
                                                                <SelectItem value="F1_CPT">F1 CPT</SelectItem>
                                                                <SelectItem value="J1">J1</SelectItem>
                                                                <SelectItem value="H1B">H1B</SelectItem>
                                                                <SelectItem value="H4_EAD">H4 EAD</SelectItem>
                                                                <SelectItem value="L1A">L1A</SelectItem>
                                                                <SelectItem value="TN">TN</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 2: Professional Information */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800 mb-4 border-b border-blue-100 pb-2">
                                                    Professional Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">LinkedIn Profile URL <span className="text-red-700">*</span></Label>
                                                        <Input name="linkedin_id" value={profile.linkedin_id} onChange={handleProfileChange} onBlur={() => {
                                                            const err = isValidURL(profile.linkedin_id) ? null : "Please provide a valid LinkedIn profile URL.";
                                                            if (err) toast.error(err);
                                                        }} placeholder="https://linkedin.com/in/username" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">GitHub Profile URL <span className="text-red-700">*</span></Label>
                                                        <Input name="github_link" value={profile.github_link} onChange={handleProfileChange} onBlur={() => {
                                                            const err = isValidURL(profile.github_link) ? null : "Please provide a valid GitHub profile URL.";
                                                            if (err) toast.error(err);
                                                        }} placeholder="https://github.com/username" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Education <span className="text-red-700">*</span></Label>
                                                        <Input name="education" value={profile.education} onChange={handleProfileChange} placeholder="Degree, University" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Total Years of Experience</Label>
                                                        <Input name="workexperience" value={profile.workexperience} onChange={handleProfileChange} placeholder="e.g. 5" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 3: Contact Information */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800 mb-4 border-b border-blue-100 pb-2">
                                                    Contact Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                                    <div className="md:col-span-2 lg:col-span-2 space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Home Address <span className="text-red-700">*</span></Label>
                                                        <AddressAutocomplete
                                                            value={profile.address}
                                                            onChange={(val, details) => {
                                                                const updates: any = { address: val };
                                                                if (details?.address) {
                                                                    const addr = details.address;
                                                                    if (addr.city || addr.town || addr.village) {
                                                                        updates.city = addr.city || addr.town || addr.village;
                                                                    }
                                                                    if (addr.state) updates.state = addr.state;
                                                                    if (addr.postcode) updates.zip_code = addr.postcode;
                                                                    if (addr.country) updates.country = addr.country;
                                                                }
                                                                setProfile({ ...profile, ...updates });
                                                            }}
                                                            placeholder="Search your address..."
                                                            className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Zip Code <span className="text-red-700">*</span></Label>
                                                        <Input name="zip_code" value={profile.zip_code} onChange={handleProfileChange} placeholder="12345" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Secondary Email</Label>
                                                        <Input name="secondaryemail" type="email" value={profile.secondaryemail} onChange={handleProfileChange} onBlur={() => { const err = isValidEmail(profile.secondaryemail) ? null : "Please provide a valid secondary email address."; if (err) toast.error(err); }} placeholder="alt-email@example.com" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Secondary Phone</Label>
                                                        <Input name="secondaryphone" value={profile.secondaryphone} onChange={handleProfileChange} onBlur={() => { const err = !profile.secondaryphone || isValidPhone(profile.secondaryphone) ? null : "Please provide a valid secondary US phone number (e.g. +1 555-123-4567)."; if (err) toast.error(err); }} placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />


                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 4: Emergency Contact */}
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800 mb-4 border-b border-blue-100 pb-2">
                                                    Emergency Contact
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Contact Name <span className="text-red-700">*</span></Label>
                                                        <Input name="emergcontactname" value={profile.emergcontactname} onChange={handleProfileChange} placeholder="Full Name" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Contact Email <span className="text-red-700">*</span></Label>
                                                        <Input name="emergcontactemail" type="email" value={profile.emergcontactemail} onChange={handleProfileChange} onBlur={() => { const err = isValidEmail(profile.emergcontactemail) ? null : "Please provide a valid emergency contact email address."; if (err) toast.error(err); }} placeholder="email@example.com" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Contact Phone <span className="text-red-700">*</span></Label>
                                                        <Input name="emergcontactphone" value={profile.emergcontactphone} onChange={handleProfileChange} onBlur={() => { const err = isValidPhone(profile.emergcontactphone) ? null : "Please provide a valid emergency contact US phone number (e.g. +1 555-123-4567)."; if (err) toast.error(err); }} placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm">Contact Address <span className="text-red-700">*</span></Label>
                                                        <AddressAutocomplete
                                                            value={profile.emergcontactaddrs}
                                                            onChange={(val) => setProfile({ ...profile, emergcontactaddrs: val })}
                                                            placeholder="Search contact address..."
                                                            className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                )}

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => {
                                            const err = validateProfile(getFilteredProfile());
                                            if (err) { toast.error(err); return; }
                                            handleSaveProfile();
                                        }}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        Save & Continue <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}

                    {step === 2 && (
                        <div className="p-8 animate-in fade-in slide-in-from-right-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Placement Terms & Conditions</h2>

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800 h-64 overflow-y-auto mb-6 text-sm text-gray-700 dark:text-gray-300 space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white text-base">Payment Guidelines and Placement Terms</h3>
                                <p>This document outlines the payment structure, placement fees, and re-support terms for candidates enrolled with our training and placement services, with a focus on IT roles including AI and ML positions.</p>

                                <h4 className="font-bold text-gray-900 dark:text-white mt-4">1. Post Placement Fees</h4>
                                <p>After successful placement, a placement fee of {profile.placement_percentage || 13}% from your offered annual salary will be applicable.</p>

                                <h4 className="font-bold text-gray-900 dark:text-white mt-4">2. Payment Method and Installments</h4>
                                <p>The post placement fee may be paid in three installments using postpaid checks.</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>All checks must be handed over before background check clearance and before onboarding date.</li>
                                    <li>The first check will be deposited before the candidate's job start date.</li>
                                    <li>All remaining checks will be deposited within two months from the candidate's start date.</li>
                                </ul>

                                {(() => {
                                    const p = profile.placement_percentage || 13;
                                    const amount = 150000 * (p / 100);
                                    const inst = Math.round(amount / 3);
                                    return (
                                        <p className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                            <strong>Illustration:</strong> If offer received of USD 150,000, then {p}% of 150,000 that is {amount.toLocaleString()} is split into three installments:
                                            <br /><br />
                                            <strong>First Installment:</strong> ${inst.toLocaleString()}, payable after BGV and before Onboarding date.<br />
                                            <strong>Second Installment:</strong> ${inst.toLocaleString()}, payable after receiving your first paycheck.<br />
                                            <strong>Third Installment:</strong> ${inst.toLocaleString()}, payable after receiving your second paycheck.
                                        </p>
                                    );
                                })()}

                                <h4 className="font-bold text-gray-900 dark:text-white mt-4">3. Support Period and Re-Placement Policy</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>We provide placement support for a period of one month from the candidate's job start date.</li>
                                    <li>If a candidate is terminated or laid off within the first two months of the job start date, we will provide re-placement support at no additional cost.</li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <div className="mt-1">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        I have read, understood, and agree to the Placement Terms and Conditions outlined above. I acknowledge my responsibility to fulfill the placement fee obligations as specified.
                                    </span>
                                </label>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <PenTool className="w-4 h-4 text-blue-500" />
                                        Adaptive Signature
                                    </Label>
                                    <p className="text-xs text-gray-500 mb-2">Type your full legal name below to sign electronically.</p>
                                    <div className="relative">
                                        <Input
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            placeholder="John Doe"
                                            className="text-2xl h-16 font-serif italic text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border-2 focus:border-blue-500"
                                            style={{ fontFamily: "'Dancing Script', 'Caveat', cursive, serif" }}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 uppercase select-none pointer-events-none">
                                            Sign Here
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    {loginCount < 10 && onSkip && (
                                        <button
                                            onClick={() => setStep(3)}
                                            className="px-4 py-2.5 text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition-all flex flex-col items-end"
                                        >
                                            <span className="text-sm">Skip for now</span>
                                            <span className="text-[10px] font-medium text-gray-400">({10 - loginCount} skips remaining)</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleFinishOnboarding}
                                        disabled={loading || !agreed || !signature.trim()}
                                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? "Saving..." : "Continue"} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="p-8 animate-in fade-in slide-in-from-right-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Enrollment Documentation Requirements</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Please upload the following required documents. Max file size: 5MB.</p>

                            <div className="space-y-4">
                                {[
                                    { id: "govId" as const, label: "Government-issued ID", desc: "e.g., Driver's License", req: true },
                                    { id: "resume" as const, label: "Updated Resume", desc: "PDF or Word format", req: false },
                                ].map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {doc.label} {doc.req && <span className="text-red-500">*</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">{doc.desc}</p>
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                id={`file-${doc.id}`}
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, doc.id)}
                                            />
                                            <label
                                                htmlFor={`file-${doc.id}`}
                                                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${documents[doc.id] ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                                            >
                                                {documents[doc.id] ? (
                                                    <><CheckCircle className="w-4 h-4" /> Uploaded</>
                                                ) : (
                                                    <><Upload className="w-4 h-4" /> Upload</>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button
                                    onClick={() => setStep(profile.enrollment_status === 'completed' ? 1 : 2)}
                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    {loginCount < 10 && onSkip && (
                                        <button
                                            onClick={onSkip}
                                            className="px-4 py-2.5 text-blue-600 font-bold hover:bg-blue-50 rounded-xl transition-all flex flex-col items-end"
                                        >
                                            <span className="text-sm">Skip for now</span>
                                            <span className="text-[10px] font-medium text-gray-400">({10 - loginCount} skips remaining)</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleUploadDocuments}
                                        disabled={loading}
                                        className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? "Completing..." : "Complete Setup"} <CheckCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
