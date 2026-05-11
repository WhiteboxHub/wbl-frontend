"use client";

import React, { useState, useEffect } from "react";
import { Check, ChevronRight, Upload, FileText, CheckCircle, AlertTriangle, PenTool } from "lucide-react";
import { Input } from "@/components/admin_ui/input";
import { Label } from "@/components/admin_ui/label";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { EditModal } from "@/components/EditModal";

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

    const [showEditModal, setShowEditModal] = useState(false);

    // Step 2 State
    const [documents, setDocuments] = useState({
        govId: null as File | null,
        workAuth: null as File | null,
        resume: null as File | null,
    });

    // Step 3 State
    const [signature, setSignature] = useState("");
    const [agreed, setAgreed] = useState(false);

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
                });
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

    const handleSaveProfile = async () => {
        const requiredFields = [
            'full_name', 'email', 'phone', 'workstatus', 
            'dob', 'github_link', 'workexperience', 'address', 
            'linkedin_id', 'secondaryemail', 'secondaryphone',
            'emergcontactname', 'emergcontactemail', 'emergcontactphone', 'emergcontactaddrs'
        ];
        
        const missingFields = requiredFields.filter(field => !profile[field]);
        
        if (missingFields.length > 0) {
            toast.error("Please fill all required details to continue.");
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            
            const filteredProfile = getFilteredProfile();

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/candidates/${candidateId}`, {
                method: "PUT",
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(filteredProfile),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Validation Error:", errorData);
                const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
                toast.error(`Error: ${detail}`);
                return;
            }

            toast.success("Profile details saved successfully");
            setStep(2);
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
        if (!documents.govId || !documents.workAuth || !documents.resume) {
            toast.error("Please upload all required documents");
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const formData = new FormData();
            
            // Append all files
            if (documents.govId) formData.append('govId', documents.govId);
            if (documents.workAuth) formData.append('workAuth', documents.workAuth);
            if (documents.resume) formData.append('resume', documents.resume);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/candidates/${candidateId}/onboarding/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
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



    const handleFinishOnboarding = async () => {
        if (!agreed || !signature.trim()) {
            toast.error("Please agree to the terms and provide your signature");
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const filteredProfile = getFilteredProfile();

            // Clean payload for final submission with basic info
            const finalPayload = {
                ...filteredProfile, // Include the already verified profile data
                agreement: "P",
                notes: `Onboarding completed and documents submitted for review at ${new Date().toLocaleString()}. Signature: ${signature}`
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/candidates/${candidateId}`, {
                method: "PUT",
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(finalPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Final Submission Error:", errorData);
                const detail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
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
                            { key: 'workexperience', label: 'Work Experience *' },
                            { key: 'address', label: 'Address *' },
                            { key: 'linkedin_id', label: 'LinkedIn ID *' },
                            { key: 'secondaryemail', label: 'Secondary Email *' },
                            { key: 'secondaryphone', label: 'Secondary Phone *' },
                            { key: 'emergcontactname', label: 'Emergency Contact Name *' },
                            { key: 'emergcontactemail', label: 'Emergency Contact Email *' },
                            { key: 'emergcontactphone', label: 'Emergency Contact Phone *' },
                            { key: 'emergcontactaddrs', label: 'Emergency Contact Address *' }
                        ];
                        const missing = requiredFields.filter(f => !profile[f.key]);
                        
                        return (
                            <div className="p-8 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Action Required: Complete Your Profile</h2>
                                
                                {missing.length > 0 ? (
                                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-sm text-red-800 dark:text-red-200 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                                        <div>
                                            <p className="font-bold mb-1">Action Required: Missing Information</p>
                                            <p className="mb-2">You must complete your profile before you can access the dashboard. Please fill in the following missing fields using the editor:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {missing.map(f => (
                                                    <span key={f.key} className="bg-red-100 dark:bg-red-800/50 px-2 py-0.5 rounded text-xs font-semibold">
                                                        {f.label}
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
                                            <p>{loginCount <= 1 ? "Please fill all required details to proceed." : "All required fields are filled. You can now proceed to the next step."}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {loading ? (
                                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                                ) : (
                                    <div className="mt-4 mb-4 flex flex-col items-center">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800 w-full mb-6">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Name <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold">{profile.full_name || "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Email <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold">{profile.email || "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Phone <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold">{profile.phone || "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Work Status <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold">{profile.workstatus || "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Date of Birth <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold">{profile.dob || "Not provided"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-gray-500">Address <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold">{profile.address ? `${profile.address}${profile.zip_code ? `, ${profile.zip_code}` : ""}` : "Not provided"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">LinkedIn ID <span className="text-red-500 font-bold">*</span></p>
                                                    <p className="font-semibold text-blue-600 truncate">{profile.linkedin_id || "Not provided"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setShowEditModal(true)}
                                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 font-bold rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <PenTool className="w-4 h-4" /> Open Profile Editor
                                        </button>
                                    </div>
                                )}

                                {showEditModal && (
                                    <EditModal
                                        isOpen={true}
                                        onClose={() => setShowEditModal(false)}
                                        data={profile}
                                        batches={[]}
                                        onSave={(updated) => {
                                            const newProfile = { ...updated };
                                            delete newProfile.id; // Ensure we don't accidentally update ID
                                            setProfile(newProfile);
                                            setShowEditModal(false);
                                        }}
                                        title="Candidate Profile"
                                    />
                                )}

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
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
                                <p>After successful placement, a placement fee of 13% from your offered annual salary will be applicable.</p>
                                
                                <h4 className="font-bold text-gray-900 dark:text-white mt-4">2. Payment Method and Installments</h4>
                                <p>The post placement fee may be paid in three installments using postpaid checks.</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>All checks must be handed over before background check clearance and before onboarding date.</li>
                                    <li>The first check will be deposited before the candidate's job start date.</li>
                                    <li>All remaining checks will be deposited within two months from the candidate's start date.</li>
                                </ul>
                                
                                <p className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                    <strong>Illustration:</strong> If offer received of USD 150,000, then 13% of 150,000 that is 19,500 is split into three installments:
                                    <br/><br/>
                                    <strong>First Installment:</strong> $6,500, payable after BGV and before Onboarding date.<br/>
                                    <strong>Second Installment:</strong> $6,500, payable after receiving your first paycheck.<br/>
                                    <strong>Third Installment:</strong> $6,500, payable after receiving your second paycheck.
                                </p>
                                
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
                                    { id: "workAuth" as const, label: "Work Authorization", desc: "EAD, Green Card, or Citizenship proof", req: true },
                                    { id: "resume" as const, label: "Updated Resume", desc: "PDF or Word format", req: true },
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
                                    onClick={() => setStep(2)}
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
