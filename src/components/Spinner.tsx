const Spinner = ({ size = 6 }: { size?: number }) => (
  <div className={`w-${size} h-${size} border-4 border-green-200 border-t-green-600 rounded-full animate-spin`} />
);

export default Spinner;
