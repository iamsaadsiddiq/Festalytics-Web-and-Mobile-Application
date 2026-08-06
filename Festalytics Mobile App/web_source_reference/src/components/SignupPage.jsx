"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUser, FaStore, FaGoogle, FaTimes, FaUpload, FaFileImage, FaEnvelopeOpenText } from 'react-icons/fa';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';

const SignupPage = () => {
    const [role, setRole] = useState('user');
    const [selectedFile, setSelectedFile] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');

    useEffect(() => {
        const roleParam = searchParams.get('role');
        if (roleParam === 'vendor' || roleParam === 'user') {
            setRole(roleParam);
        }
    }, [searchParams]);

    // Form States
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cnic, setCnic] = useState('');
    const [hallName, setHallName] = useState('');
    const [area, setArea] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [capacity, setCapacity] = useState('');
    const [businessPhone, setBusinessPhone] = useState('');
    const [hallDescription, setHallDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        router.push('/');
    };

    const handleCnicInput = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 13) value = value.substring(0, 13);
        if (value.length > 12) {
            value = `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12)}`;
        } else if (value.length > 5) {
            value = `${value.slice(0, 5)}-${value.slice(5)}`;
        }
        setCnic(value);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Error Handling: Password mismatch
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setIsSubmitting(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const fullName = `${firstName} ${lastName}`.trim();

            await updateProfile(user, { displayName: fullName });
            await user.reload();

            if (role === 'vendor') {
                const pendingVendorOnboarding = {
                    hallName,
                    area,
                    address: streetAddress,
                    capacity,
                    businessPhone: businessPhone || mobileNumber,
                    mobileNumber,
                    description: hallDescription,
                };

                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    firstName,
                    lastName,
                    fullName,
                    gender,
                    mobileNumber,
                    email,
                    birthday,
                    role,
                    cnic,
                    pendingVendorOnboarding,
                    emailVerified: false,
                    onboardingComplete: false,
                    venueId: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                await sendEmailVerification(user, {
                    url: `${window.location.origin}/verify-email`,
                });

                router.push('/verify-email');
            } else {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    firstName,
                    lastName,
                    fullName,
                    gender,
                    mobileNumber,
                    email,
                    birthday,
                    role,
                    cnic: null,
                    emailVerified: user.emailVerified === true,
                    createdAt: serverTimestamp()
                });
                router.push(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/user-dashboard');
            }
        } catch (error) {
            console.error("Signup Error:", error);
            alert("Signup Failed: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignup = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user doc exists
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                // Existing user - Check Role
                const userData = userDocSnap.data();
                if (userData.role === 'user') {
                    router.push(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/user-dashboard');
                } else {
                    alert(`This account is registered as a ${userData.role}. Please login with the correct account type.`);
                }
            } else {
                // New User - Create Doc
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    firstName: user.displayName ? user.displayName.split(' ')[0] : 'User',
                    lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                    fullName: user.displayName,
                    email: user.email,
                    role: 'user',
                    createdAt: serverTimestamp()
                });
                router.push(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/user-dashboard');
            }
        } catch (error) {
            console.error("Google Signup Error:", error);
            alert(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>

            <div className="relative w-full max-w-md bg-[#2d2d2d] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <button onClick={handleClose} className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white transition-all hover:bg-[#D6336C] hover:border-[#D6336C] hover:rotate-90 cursor-pointer">
                    <FaTimes size={14} />
                </button>

                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
                        <p className="text-gray-400 text-xs mb-3">Sign up to get started</p>
                    </div>

                    <div className="border-b border-white/10 mb-4"></div>

                    {/* Role Toggle */}
                    <div className="flex bg-[#151515] rounded-lg p-1 mb-4 border border-white/5">
                        <button type="button" onClick={() => { setRole('user'); setSelectedFile(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${role === 'user' ? 'bg-[#D6336C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}>
                            <FaUser className={`text-xs ${role === 'user' ? 'text-white' : 'text-gray-500'}`} /> User
                        </button>
                        <button type="button" onClick={() => { setRole('vendor'); setSelectedFile(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${role === 'vendor' ? 'bg-[#D6336C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}>
                            <FaStore className={`text-xs ${role === 'vendor' ? 'text-white' : 'text-gray-500'}`} /> Vendor
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        {/* USER INPUTS */}
                        {role === 'user' && (
                            <>
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">First Name</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ali" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Last Name</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Khan" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Gender</label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required>
                                            <option value="" disabled>Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Mobile Number</label>
                                        <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="0300-1234567" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Birthday</label>
                                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm [color-scheme:dark]" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Create Password</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Confirm Password</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                            </>
                        )}

                        {/* VENDOR INPUTS */}
                        {role === 'vendor' && (
                            <>
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">First Name</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ali" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Last Name</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Khan" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Mobile Number</label>
                                        <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="0300-1234567" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">CNIC</label>
                                        <input type="text" value={cnic} onChange={handleCnicInput} placeholder="42101-1234567-1" maxLength={15} className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Gender</label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required>
                                            <option value="" disabled>Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Birthday</label>
                                        <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm [color-scheme:dark]" required />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendor@example.com" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                                <div className="border-t border-white/10 pt-3 mt-1">
                                    <p className="text-[10px] font-black text-[#D6336C] uppercase tracking-widest mb-2">Your venue / hall</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Hall / Business Name *</label>
                                    <input type="text" value={hallName} onChange={(e) => setHallName(e.target.value)} placeholder="e.g. Royal Garden Banquet" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">City / Area *</label>
                                        <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Johar Town" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                    <div className="flex flex-col gap-1 w-1/2">
                                        <label className="text-gray-300 text-xs font-medium ml-1">Capacity (guests) *</label>
                                        <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="500" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Street Address *</label>
                                    <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Plot 12, Block A, Main Road" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Business Phone (optional)</label>
                                    <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="Same as mobile or hall line" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Short description (optional)</label>
                                    <textarea value={hallDescription} onChange={(e) => setHallDescription(e.target.value)} placeholder="Brief description for your public listing..." rows={2} className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm resize-none" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Password</label>
                                    <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setConfirmPassword(e.target.value) }} placeholder="Create password" className="w-full bg-[#151515] text-white border border-white/10 rounded-lg p-2 outline-none focus:ring-1 focus:ring-[#D6336C] text-sm" required />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-gray-300 text-xs font-medium ml-1">Upload ID/Doc (JPG)</label>
                                    {!selectedFile ? (
                                        <div className="relative">
                                            <input type="file" accept=".jpg, .jpeg" onChange={handleFileChange} className="w-full bg-[#151515] text-gray-400 border border-white/10 rounded-lg p-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#D6336C] file:text-white hover:file:bg-[#C2255C] cursor-pointer" required />
                                            <FaUpload className="absolute right-3 top-3 text-gray-500 text-xs pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full bg-[#151515] border border-[#D6336C] rounded-lg p-2">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FaFileImage className="text-[#D6336C]" />
                                                <span className="text-white text-sm truncate max-w-[200px]">{selectedFile.name}</span>
                                            </div>
                                            <button type="button" onClick={removeFile} className="text-gray-400 hover:text-red-500 transition-colors p-1"><FaTimes size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={isSubmitting} className="w-full bg-[#D6336C] hover:bg-[#C2255C] disabled:opacity-60 text-white font-bold py-2 rounded-lg transition-colors shadow-lg mt-2 cursor-pointer text-sm">
                            {isSubmitting ? 'Creating account...' : `Sign Up as ${role === 'user' ? 'User' : 'Vendor'}`}
                        </button>
                    </form>

                    {role === 'user' && (
                        <>
                            <div className="flex items-center gap-4 my-4">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-gray-500 text-[10px] uppercase tracking-wider">Or continue with</span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>
                            <button type="button" onClick={handleGoogleSignup} className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer text-sm">
                                <FaGoogle className="text-red-500" /> <span>Sign up with Google</span>
                            </button>
                        </>
                    )}

                    <p className="text-center text-gray-400 text-xs mt-3">
                        Already have an account? <Link href="/" className="text-[#D6336C] hover:underline font-medium">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;