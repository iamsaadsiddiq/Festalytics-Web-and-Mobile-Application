import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ProtectedRoute = ({ children, allowedRole }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [redirectTo, setRedirectTo] = useState('/');
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                setLoading(false);
                setUser(null);
                setRedirectTo('/');
                return;
            }

            setUser(currentUser);

            try {
                // Fetch user role from Firestore to double-check access
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    if (allowedRole === 'vendor') {
                        await currentUser.reload();
                    }
                    const freshUser = auth.currentUser || currentUser;
                    const hasLinkedVenue = Boolean(userData.venueId);
                    const pendingVendor = Boolean(userData.pendingVendorOnboarding);
                    const needsVendorVerification =
                        allowedRole === 'vendor' &&
                        userData.role === 'vendor' &&
                        !freshUser.emailVerified &&
                        !hasLinkedVenue;
                    const needsVendorFinalization =
                        allowedRole === 'vendor' &&
                        userData.role === 'vendor' &&
                        freshUser.emailVerified &&
                        !hasLinkedVenue &&
                        pendingVendor;

                    if (needsVendorVerification || needsVendorFinalization) {
                        setRedirectTo('/verify-email');
                        setIsAuthorized(false);
                    } else if (userData.role === allowedRole) {
                        setRedirectTo('/');
                        setIsAuthorized(true);
                    } else {
                        console.warn(`Role mismatch: Expected ${allowedRole}, got ${userData.role}`);
                        setRedirectTo('/');
                        setIsAuthorized(false);
                    }
                } else {
                    // Fallback: If no doc, we might want to check if the allowedRole matches what we expect or just allow 'user'
                    // For strict security, we deny if no role is found
                    console.warn("No user document found for role verification.");
                    setRedirectTo('/');
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Error verifying access:", error);
                setRedirectTo('/');
                setIsAuthorized(false);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [allowedRole, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/');
        return null;
    }

    if (!isAuthorized) {
        router.push(redirectTo);
        return null;
    }

    return children;
};

export default ProtectedRoute;
