export default function Home() {
  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="text-gray-500 mt-2">
        Welcome back to Falafel Flare
      </p>


      <div className="grid grid-cols-4 gap-6 mt-8">


        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Today's Orders
          </p>

          <h2 className="text-4xl font-bold mt-2">
            24
          </h2>
        </div>



        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            New Orders
          </p>

          <h2 className="text-4xl font-bold mt-2">
            5
          </h2>
        </div>



        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Preparing
          </p>

          <h2 className="text-4xl font-bold mt-2">
            8
          </h2>
        </div>



        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-500">
            Ready Pickup
          </p>

          <h2 className="text-4xl font-bold mt-2">
            11
          </h2>
        </div>


      </div>



      <div className="bg-white rounded-xl shadow mt-8 p-6">


        <h2 className="text-2xl font-bold mb-5">
          Today's Activity
        </h2>



        <div className="space-y-4">


          <div className="border rounded-lg p-4">

            <p className="font-bold">
              Order #201
            </p>

            <p>
              Chicken Shawarma + Fries
            </p>

            <p className="text-orange-600">
              Preparing
            </p>

          </div>



          <div className="border rounded-lg p-4">

            <p className="font-bold">
              Order #202
            </p>

            <p>
              Falafel Plate
            </p>

            <p className="text-green-600">
              Ready for Pickup
            </p>

          </div>



        </div>


      </div>


    </div>
  );
}