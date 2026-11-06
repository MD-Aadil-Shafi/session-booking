import Loading from "../components/Loading";
import ProfessionalCard from "../components/professionals/ProfessionalCard";
import { listProfAction } from "../redux/slices/professionalSlice";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import { useEffect } from "react";


export interface Professional {
  id: number;
  firstName: string;
  lastName: string;
  timezone: string;
}

const Professionals = () => {
    const dispatch = useAppDispatch();

  const { profList:data, loading } = useAppSelector(
    (state) => state.professionals
  );

  useEffect(() => {
    dispatch(listProfAction());
  }, [dispatch]);

  console.log('data', data)

  return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Professionals List
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Browse and explore our list of professionals.
          </p>
        </div>

        {loading ? 
        <p>Loading Professional's Records...</p>
        :
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.map((item:Professional) => (
            <ProfessionalCard
              key={item?.id}
              professional={item}
            />
          ))}
        </div>
        }
      </div>
    </main>
  )
}

export default Professionals