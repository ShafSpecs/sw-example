export async function loader() {
    throw new Response(null, {
        status: 500,
        statusText: 'Internal Server Error'
    })
}

export default function Catch() {
    return <div></div>
}