import type { Professional } from '../../pages/Professionals';
import { useNavigate } from 'react-router-dom';

interface ProfessionalCardProps {
  professional: Professional;
}

export default function ProfessionalCard({
  professional,
}: ProfessionalCardProps) {
  const { firstName, lastName, timezone, id } = professional;
//will pass navigate instance as props in production app.
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {firstName} {lastName}
        </h2>

        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <span>🌐</span>
          {timezone}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <h3 className="mb-1 text-sm font-medium text-gray-700">
          About
        </h3>

        <p className="text-sm leading-6 text-gray-600">
          Lorem ipsum dolor,it rerum iure minus laborum ihil non nulla impedit facere nostrum deleniti.
        </p>
        <div className='flex justify-end'>
        <button className='bg-indigo-500 rounded-xl shadow px-2 py-0 text-white hover:cursor-pointer'
        onClick={()=>navigate(`/professional/${id}`)}
        >View Details</button>
        </div>
      </div>
    </div>
  );
}