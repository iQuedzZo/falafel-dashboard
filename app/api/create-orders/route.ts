import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}


export async function POST(req: Request) {

  try {

    const body = await req.json();

    console.log(
      "FULL BODY:",
      JSON.stringify(body, null, 2)
    );


    const toolCall =
      body.message?.toolCalls?.[0] ||
      body.message?.toolCallList?.[0];


    const toolCallId =
      toolCall?.id ||
      toolCall?.toolCallId ||
      "unknown";


    let args =
      toolCall?.function?.arguments ||
      toolCall?.arguments ||
      body;


    if (typeof args === "string") {
      args = JSON.parse(args);
    }


    console.log("ORDER DATA:", args);



    if (
      !args.customer_name ||
      !args.phone ||
      !args.items
    ) {

      return NextResponse.json(
        {
          results: [
            {
              toolCallId,
              result:
                "Missing customer name, phone number, or items."
            }
          ]
        },
        {
          status:200,
          headers:{
            "Access-Control-Allow-Origin":"*"
          }
        }
      );
    }



    const {data,error} =
      await serverSupabase
        .from("orders")
        .insert([
          {
            customer_name: args.customer_name,
            phone: args.phone,
            items: args.items,
            order_total: args.order_total,
            special_instructions: args.special_instructions,
            status: "New",
            order_time: new Date().toISOString(),
          },
        ])
        .select()
        .single();



    if(error){

      console.log(
        "SUPABASE ERROR:",
        error
      );


      return NextResponse.json(
        {
          results:[
            {
              toolCallId,
              result:
                "Order could not be saved."
            }
          ]
        },
        {
          status:200
        }
      );
    }



    console.log(
      "ORDER SAVED:",
      data
    );



    return NextResponse.json(
      {
        results:[
          {
            toolCallId,
            result:
              "Order placed successfully."
          }
        ]
      },
      {
        status:200,
        headers:{
          "Access-Control-Allow-Origin":"*"
        }
      }
    );



  } catch(error:any){


    console.log(
      "API ERROR:",
      error
    );


    return NextResponse.json(
      {
        results:[
          {
            toolCallId:"unknown",
            result:
              "Order could not be saved."
          }
        ]
      },
      {
        status:200
      }
    );

  }

}