shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
uniform vec3 shallow_color : source_color = vec3(0.13,0.43,0.41);
uniform vec3 deep_color : source_color = vec3(0.035,0.20,0.26);
uniform vec3 foam_color : source_color = vec3(0.67,0.82,0.70);
varying vec3 water_position;
void vertex(){
 water_position=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
 VERTEX.y+=sin(water_position.x*1.4+water_position.z*0.8+TIME*0.7)*0.012;
}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+vec2(1)),f.x),f.y);}
void fragment(){
 vec2 p=water_position.xz;
 float cloud=noise2(p*0.65+vec2(TIME*0.035,-TIME*0.12));
 float waves=sin(p.x*3.1+p.y*1.7+TIME*1.1+cloud*5.0);
 float ripple=noise2(p*vec2(2.0,5.0)+vec2(TIME*0.05,-TIME*0.4));
 float edge=smoothstep(0.72,1.0,abs(UV.x*2.0-1.0));
 float fresnel=pow(1.0-max(dot(NORMAL,VIEW),0.0),3.0);
 vec3 water=mix(shallow_color,deep_color,0.35+fresnel*0.35);
 water=mix(water,shallow_color,edge*0.7);
 float foam=edge*edge*smoothstep(0.40,0.72,cloud)*0.55;
 float glint=smoothstep(0.92,0.995,ripple)*0.18;
 ALBEDO=mix(water,foam_color,foam+glint);
 NORMAL=normalize(NORMAL+vec3(waves*0.035,(ripple-0.5)*0.05,0.0));
 ROUGHNESS=0.28; SPECULAR=0.6;
}
