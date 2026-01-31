import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen flex flex-col space-y-20 overflow-hidden bg-white">
            {/* Hero Skeleton */}
            <section className="relative h-[90vh] flex flex-col justify-center px-6 pt-32 pb-20">
                <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
                    <div className="w-full lg:w-1/2 space-y-8">
                        <Skeleton className="h-16 w-3/4" />
                        <Skeleton className="h-16 w-1/2" />
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Skeleton className="h-14 w-40 rounded-full" />
                            <Skeleton className="h-14 w-40 rounded-full" />
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex justify-center">
                        <Skeleton className="w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] rounded-full" />
                    </div>
                </div>
            </section>

            {/* Offers Skeleton */}
            <section className="max-w-7xl mx-auto px-6 w-full">
                <div className="mb-8 flex justify-center">
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Skeleton className="h-64 rounded-xl w-full" />
                    <Skeleton className="h-64 rounded-xl w-full" />
                    <Skeleton className="h-64 rounded-xl w-full" />
                </div>
            </section>

            {/* Services Skeleton */}
            <section className="max-w-7xl mx-auto px-6 w-full pb-20">
                <div className="mb-8 flex flex-col items-center gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-12 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-48 rounded-xl w-full" />
                    <Skeleton className="h-48 rounded-xl w-full" />
                    <Skeleton className="h-48 rounded-xl w-full" />
                    <Skeleton className="h-48 rounded-xl w-full" />
                </div>
            </section>
        </main>
    )
}
